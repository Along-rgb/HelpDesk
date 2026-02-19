'use client';

import * as React from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginInput, LoginSchema } from '@/global/validators/login.schema';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

import { authenStore } from '@/app/store/user/loginAuthStore';
import { useUsersStore } from '@/app/store/user/usersStore';
import { useUserProfileStore } from '@/app/store/user/userProfileStore';
import { useRouter } from 'next/navigation';

export default function LoginForm() {

    // STORES
    const { setAuthData } = authenStore();
    const { loginUser } = useUsersStore();
    const router = useRouter();

    // UI STATE
    const [isLoading, setLoading] = React.useState(false);
    const [remember, setRemember] = React.useState(false);
    const toast = React.useRef<Toast>(null);

    // FORM
    const { control, register, handleSubmit, formState: { errors } } =
        useForm<LoginInput>({
          resolver: zodResolver(LoginSchema),
        defaultValues: {
            username: "",
            password: ""
        }
    });

    // TOAST HELPER
    const showMessage = (
        severity: "success" | "info" | "warn" | "error",
        summary: string,
        detail: string
    ) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            life: 3000
        });
    };

    // LOGIN SUBMIT HANDLER
    const onSubmit: SubmitHandler<LoginInput> = async (data) => {
        try {
            setLoading(true);
            const resp: any = await loginUser(data);

            // ตรวจสอบ Status Code
            if (resp.status === 200 || resp.status === 201) {
                
                const responseBody = resp.data || resp; // บางที axios คืนค่ามาใน data
                const token = responseBody.token || responseBody.accessToken;
                const userObj = responseBody.user || {};
                const employeeObj = userObj.employee || {};

                if (token) {
                    const displayName = `${employeeObj.first_name ?? ''} ${employeeObj.last_name ?? ''}`.trim();

                    console.log('✅ Login Success - Token:', token);
                    console.log('👤 User from login response:', userObj);

                    // 1. Toast ต้อนรับ
                    showMessage(
                        'success',
                        'Login Successful',
                        `ຍິນດີຕ້ອນຮັບທ່ານ ${displayName || data.username}`
                    );

                    // 2. เก็บ token + employeeId ลง localStorage
                    localStorage.setItem('token', token);
                    localStorage.setItem('tokenIssuedAt', Date.now().toString());
                    const empId = userObj.employeeId ?? employeeObj.id;
                    if (empId) {
                        localStorage.setItem('employeeId', String(empId));
                    }

                    // 3. อัปเดต Auth Store
                    setAuthData({
                        tokenType: 'Bearer',
                        accessToken: token
                    });

                    // 4. เก็บ user เบื้องต้นจาก login (แสดงบางข้อมูลได้ก่อน)
                    //    แล้วเรียก fetchUserProfile เพื่อดึงข้อมูล relations ครบ
                    useUserProfileStore.getState().setCurrentUser(userObj);
                    try {
                        await useUserProfileStore.getState().fetchUserProfile();
                    } catch (e) {
                        console.error('Profile fetch after login:', e);
                    }

                    // 5. ไปหน้าถัดไป
                    setTimeout(() => {
                        router.push('/uikit/MainBoard');
                        setLoading(false);
                    }, 500);

                } else {
                    // กรณี Login ผ่านแต่หา Token ไม่เจอใน Response
                    console.error("❌ Token Not Found in Response:", responseBody);
                    showMessage("error", "Data Error", "Login สำเร็จแต่ไม่พบ Token (API Structure Mismatch)");
                    setLoading(false);
                }

            } else {
                // กรณี Status ไม่ใช่ 200/201
                showMessage("error", "Login Failed", resp?.data?.message || "ໄອດີ ຫຼື ລະຫັດຜິດ");
                setLoading(false);
            }

        } catch (error: any) {
            console.error("🔥 Login Exception:", error);
            const status = error?.response?.status;
            const data = error?.response?.data;
            const apiMessage =
                (typeof data?.message === 'string' && data.message) ||
                data?.error ||
                (typeof data === 'string' && data) ||
                (Array.isArray(data?.errors) && data.errors.map((e: any) => e?.message ?? e).filter(Boolean).join(', '));
            const fallback =
                status === 400 ? 'ຂໍ້ມູນບໍ່ຖືກຕ້ອງ (ກະລຸນາກວດສອບຊື່ຜູ້ໃຊ້ ແລະ ລະຫັດຜ່ານ)' :
                status === 401 ? 'ໄອດີ ຫຼື ລະຫັດຜິດ' :
                status === 404 ? 'ບໍ່ພົບຈຸດສົ່ງຂໍ້ມູນເຂົ້າລະບົບ' :
                'ເກີດຂໍ້ຜິດພາດຈາກເຊີເວີ';
            showMessage("error", "ເຂົ້າລະບົບບໍ່ສຳເລັດ", apiMessage || error?.message || fallback);
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen w-full flex align-items-center justify-content-center"
            style={{
                backgroundImage: "url('/layout/images/bg_login.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                padding: "1rem"
            }}
        >
            <Toast ref={toast} />

            <div
                className="surface-card p-5 border-round-3xl shadow-3 w-full sm:w-4 md:w-3"
                style={{ background: "rgba(255,255,255,0.85)" }}
            >
                <div className="text-center mb-4">
                    <img
                        src="/layout/images/logologin.png"
                        alt="Logo"
                        height="90"
                        className="mb-3"
                    />
                    <h2 className="m-0 text-2xl font-semibold">EDL-HelpDesk</h2>
                </div>

                <form id="LoginForm" onSubmit={handleSubmit(onSubmit)}>
                    <label htmlFor="username" className="text-lg font-medium"></label>
                    {errors.username?.message && (
                        <small className="p-error">{errors.username.message}</small>
                    )}
                    <InputText
                        id="username"
                        {...register('username')}
                        placeholder="Enter your ID"
                        autoComplete="username"
                        className={classNames('w-full mb-3', { 'p-invalid': errors.username })}
                        style={{
                            padding: '1rem',
                            borderRadius: '10px',
                            height: "2.5rem"
                        }}
                    />

                    <label htmlFor="password" className="text-lg font-medium mt-3"></label>
                    {errors.password?.message && (
                        <small className="p-error">ປ້ອນລະຫັດ</small>
                    )}
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <Password
                                inputId="password"
                                {...field}
                                value={field.value || ""}
                                placeholder="Password"
                                autoComplete="current-password"
                                toggleMask
                                className={classNames('w-full mb-3', { 'p-invalid': errors.password })}
                                inputStyle={{ borderRadius: '10px', height: "2.5rem" }}
                                inputClassName="w-full p-3"
                            />
                        )}
                    />

                    <div className="flex justify-content-between align-items-center mb-4 mt-2">
                        <div className="flex align-items-center gap-2">
                            <Checkbox
                                inputId="remember"
                                checked={remember}
                                onChange={(e) => setRemember(e.checked ?? false)}
                            />
                            <label htmlFor="remember">ຈື່ຂ້ອຍໄວ້</label>
                        </div>

                        <a
                            className="cursor-pointer text-primary"
                            onClick={() => router.push('#')}
                        >
                            ລືມລະຫັດຜ່ານ?
                        </a>
                    </div>

                    <Button
                        loading={isLoading}
                        label="ເຂົ້າລະບົບ"
                        type="submit"
                        className="w-full p-3 text-xl"
                    />
                </form>
            </div>
        </div>
    );
}