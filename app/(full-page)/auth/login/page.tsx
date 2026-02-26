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
 * หน้า Login: พื้นหลัง backgroundhelpdesk.png, แบ่งซ้าย (รูป helpdesk) ขวา (ฟอร์ม logologin)
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
      <style>{`
        .login-btn-helpdesk {
          background: linear-gradient(180deg, #7eb8da 0%, #4a90b5 100%) !important;
          border: none !important;
          color: #fff !important;
          transition: background 0.2s ease, filter 0.2s ease;
        }
        .login-btn-helpdesk:hover:not(:disabled) {
          background: linear-gradient(135deg, #b8dcee 0%, #8ec5e0 50%, #5aa3c9 100%) !important;
          filter: brightness(1.05);
        }
      `}</style>
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
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <span className="p-input-icon-left w-full block mb-3">
                  <i className="pi pi-lock" />
                  <Password
                    inputId="password"
                    {...field}
                    value={field.value || ''}
                    placeholder="Password"
                    autoComplete="current-password"
                    toggleMask
                    feedback
                    weakLabel="ງ່າຍ"
                    mediumLabel="ປານກາງ"
                    strongLabel="ປອດໄພ"
                    className={classNames('w-full', { 'p-invalid': errors.password })}
                    inputStyle={{
                      paddingLeft: '2.5rem',
                      borderRadius: '10px',
                      height: '2.75rem',
                      width: '100%',
                    }}
                    inputClassName="w-full"
                  />
                </span>
              )}
            />

            <div className="flex justify-content-between align-items-center mb-4 mt-2">
              <div className="flex align-items-center gap-2">
                <Checkbox
                  inputId="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.checked ?? false)}
                />
                <label htmlFor="remember" className="cursor-pointer text-color">
                  ຈື່ຂ້ອຍໄວ້
                </label>
              </div>
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
