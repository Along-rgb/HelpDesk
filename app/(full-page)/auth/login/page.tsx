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
import { useUsersStore } from '@/app/store/user/usersStroe';
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
            username: "", // ✅ กำหนดค่าเริ่มต้นเป็น text ว่าง
            password: ""  // ✅ กำหนดค่าเริ่มต้นเป็น text ว่าง
        }
    });
    // TOAST
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

    // LOGIN API
    // LOGIN API
    const onSubmit: SubmitHandler<LoginInput> = async (data) => {
        try {
            setLoading(true);
            const resp: any = await loginUser(data);

            if (resp.status === 200 || resp.status === 201) {
                // ดึงข้อมูล User ออกมาจาก Response
                const userData = resp?.data?.data;

                // จัดเตรียมชื่อที่จะแสดงผล (ดึงจาก field: firstname และ name ตามที่คุณระบุ)
                const displayName = `${userData?.firstname || ''} ${userData?.name || userData?.lastname || ''}`;

                // เปลี่ยนข้อความ Toast ให้ทักทายด้วยชื่อจริง
                showMessage("success", "Login Successful", `ຍິນດີຕ້ອນຮັບທ່ານ ${displayName}`);

                localStorage.setItem('token', userData?.accessToken);
                localStorage.setItem('lastTime', Date.now().toString());

                // *** เพิ่มบรรทัดนี้: บันทึกข้อมูลผู้ใช้ลง LocalStorage เพื่อให้หน้าอื่นดึงชื่อไปแสดงแทน "ທັດສະນີ" ได้ ***
                localStorage.setItem('userData', JSON.stringify(userData));

                setAuthData(userData);

                setTimeout(() => {
                    router.push('/uikit/MainBoard');
                    setLoading(false);
                }, 800);

            } else {
                showMessage("error", "Login Failed", resp?.data?.message || "ໄອດີ ຫຼື ລະຫັດຜິດ");
                setLoading(false);
            }

        } catch (error: any) {
            showMessage("error", "Server Error", error?.message || "Server error");
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

            {/* TOAST */}
            <Toast ref={toast} />

            {/* LOGIN CARD */}
            <div
                className="surface-card p-5 border-round-3xl shadow-3 w-full sm:w-4 md:w-3"
                style={{ background: "rgba(255,255,255,0.85)" }}
            >

                {/* LOGO */}
                <div className="text-center mb-4">
                    <img
                        src="/layout/images/logologin.png"
                        alt="Logo"
                        height="90"
                        className="mb-3"
                    />
                    <h2 className="m-0 text-2xl font-semibold">EDL-HelpDesk</h2>
                </div>

                {/* FORM */}
                <form id="LoginForm" onSubmit={handleSubmit(onSubmit)}>

                    {/* USERNAME */}
                    <label htmlFor="username" className="text-lg font-medium">

                    </label>

                    {/* messge ແຈ້ງເຕືອນ ການປ້ອນລະຫັດ */}
                    {errors.username?.message && (
                        <small className="p-error">{errors.username.message}</small>
                    )}

                    <InputText
                        {...register('username')}
                        placeholder="Enter your ID"
                        className={classNames('w-full mb-3', { 'p-invalid': errors.username })}
                        style={{
                            padding: '1rem',
                            borderRadius: '10px',
                            height: "2.5rem"
                        }}
                    />


                    {/* PASSWORD */}
                    <label htmlFor="password" className="text-lg font-medium mt-3">

                    </label>

                    {/* messge ແຈ້ງເຕືອນ ການປ້ອນລະຫັດ */}
                    {errors.password?.message && (
                        <small className="p-error">ປ້ອນລະຫັດ</small>
                    )}

                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <Password
                                {...field}
                                value={field.value || ""}
                                placeholder="Password"
                                toggleMask
                                className={classNames('w-full mb-3', { 'p-invalid': errors.password })}
                                inputStyle={{ borderRadius: '10px', height: "2.5rem" }}
                                inputClassName="w-full p-3"
                            />
                        )}
                    />


                    {/* REMEMBER + FORGOT */}
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

                    {/* BUTTON */}
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
