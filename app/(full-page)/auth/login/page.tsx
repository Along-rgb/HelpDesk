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
import { useRouter } from 'next/navigation';

import { authenStore } from '@/app/store/user/loginAuthStore';
import { useUserProfileStore } from '@/app/store/user/userProfileStore';
import { clearAppSession } from '@/utils/authHelper';
import { useAuthLogin } from './hooks/useAuthLogin';

/**
 * หน้า Login: รับค่าฟอร์ม, เรียก handleLogin จาก useAuthLogin, แสดง Toast เท่านั้น
 * Reset Store เมื่อ Mount (หลัง redirect จาก 401) เพื่อให้ state สอดคล้องกับ storage
 */
export default function LoginForm() {
  const router = useRouter();
  const [remember, setRemember] = React.useState(false);
  const toast = React.useRef<Toast>(null);

  const showMessage: (severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string) => void =
    React.useCallback((severity, summary, detail) => {
      toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

  const { handleLogin, isLoading } = useAuthLogin(showMessage);

  // Logout/401: ลบ auth + profile store และ localStorage (roleId, employeeId ແລະ ອື່ນ) ໃຫ້ຖືກຕ້ອງສະເໝີ
  React.useEffect(() => {
    clearAppSession();
    authenStore.getState().clearAuthData();
    useUserProfileStore.getState().clearProfile();
  }, []);

  const { control, register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit: SubmitHandler<LoginInput> = React.useCallback(
    (data) => { void handleLogin(data); },
    [handleLogin]
  );

  return (
    <div
      className="min-h-screen w-full flex align-items-center justify-content-center"
      style={{
        backgroundImage: "url('/layout/images/bg_login.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '1rem',
      }}
    >
      <Toast ref={toast} />

      <div
        className="surface-card p-5 border-round-3xl shadow-3 w-full sm:w-4 md:w-3"
        style={{ background: 'rgba(255,255,255,0.85)' }}
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
            style={{ padding: '1rem', borderRadius: '10px', height: '2.5rem' }}
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
                value={field.value || ''}
                placeholder="Password"
                autoComplete="current-password"
                toggleMask
                className={classNames('w-full mb-3', { 'p-invalid': errors.password })}
                inputStyle={{ borderRadius: '10px', height: '2.5rem' }}
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
