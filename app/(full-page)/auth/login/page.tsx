'use client';

import * as React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginInput, LoginSchema } from '@/global/validators/login.schema';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useRouter } from 'next/navigation';
import { authenStore } from '@/app/store/user/loginAuthStore';
import { useUserProfileStore } from '@/app/store/user/userProfileStore';
import { clearAppSession } from '@/utils/authHelper';
import { useAuthLogin } from './hooks/useAuthLogin';
import './login.scss';

/**
 * หน้า Login: พื้นหลัง backgroundhelpdesk.png, แบ่งซ้าย (รูป helpdesk) ขวา (ฟอร์ม logologin)
 * Reset Store เมื่อ Mount (หลัง redirect จาก 401) เพื่อให้ state สอดคล้องกับ storage
 */
export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const toast = React.useRef<Toast>(null);

  const showMessage: (severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string) => void =
    React.useCallback((severity, summary, detail) => {
      toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

  const { handleLogin, isLoading } = useAuthLogin(showMessage);

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
      className="min-h-screen w-full flex align-items-center justify-content-center p-3"
      style={{
        backgroundImage: "url('/layout/images/backgroundhelpdesk.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Toast ref={toast} />

      <div
        className="flex w-full border-round-3xl shadow-3 overflow-hidden"
        style={{
          maxWidth: '960px',
          minHeight: '520px',
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* ซ้าย: รูป helpdesk (พื้นที่โฆษณา/ภาพประกอบ) */}
        <div
          className="hidden md:flex flex-1 align-items-center justify-content-center p-4"
          style={{ minWidth: 0 }}
        >
          <img
            src="/layout/images/helpdesk.png"
            alt="EDL HelpDesk"
            className="w-full h-full object-contain"
            style={{ maxHeight: '480px' }}
          />
        </div>

        {/* ขวา: ฟอร์มล็อกอิน (พื้นขาวโปร่งใส) */}
        <div
          className="flex flex-column flex-1 p-5 justify-content-center"
          style={{
            background: 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(6px)',
            minWidth: '320px',
          }}
        >
          <div className="text-center mb-4">
            <img
              src="/layout/images/logologin.png"
              alt="Logo"
              height="72"
              width="72"
              className="mb-2"
            />
            <h2 className="m-0 text-2xl font-semibold text-color">EDL-HelpDesk</h2>
            <p className="text-color-secondary text-sm mt-1 mb-0">
              ລະບົບບໍລິການຊ່ວຍເຫຼືອພາຍໃຕ້ບໍລິການ
            </p>
          </div>

          <form id="LoginForm" onSubmit={handleSubmit(onSubmit)}>
            {errors.username?.message && (
              <small className="p-error block mb-1">{errors.username.message}</small>
            )}
            <span className="p-input-icon-left w-full block mb-3">
              <i className="pi pi-user" />
              <InputText
                id="username"
                {...register('username')}
                placeholder="ລະຫັດພະນັກງານ"
                autoComplete="username"
                className={classNames('w-full', { 'p-invalid': errors.username })}
                style={{ paddingLeft: '2.5rem', borderRadius: '10px', height: '2.75rem' }}
              />
            </span>

            {errors.password?.message && (
              <small className="p-error block mb-1">{errors.password.message}</small>
            )}
            <span className="p-input-icon-left w-full block mb-3" style={{ position: 'relative' }}>
              <i className="pi pi-lock" />
              <InputText
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="ລະຫັດຜ່ານ"
                autoComplete="current-password"
                className={classNames('w-full', { 'p-invalid': errors.password })}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', borderRadius: '10px', height: '2.75rem' }}
              />
              <i
                className={classNames('pi', showPassword ? 'pi-eye-slash' : 'pi-eye')}
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '70%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  color: '#6c757d',
                  zIndex: 10
                }}
              />
            </span>

            <div className="flex justify-content-end align-items-center mb-4 mt-2">
              <a
                className="cursor-pointer text-primary text-sm"
                onClick={() => router.push('#')}
              >
                ລືມລະຫັດຜ່ານ?
              </a>
            </div>

            <Button
              loading={isLoading}
              label="ເຂົ້າລະບົບ →"
              type="submit"
              iconPos="right"
              className="login-btn-helpdesk w-full p-3 text-lg border-round-lg"
            />
          </form>
        </div>
      </div>
    </div>
  );
}

