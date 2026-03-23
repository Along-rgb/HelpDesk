import * as React from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginInput, LoginSchema } from '@/global/validators/login.schema';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { authenStore } from '@/app/store/user/loginAuthStore';
import { useUsersStore } from '@/app/store/user/usersStore';
import { Toast } from 'primereact/toast';
import { useRouter } from 'next/navigation';
export interface ILoginformProps {

}

export default function Loginform(props: ILoginformProps) {
  const [isLoading, setLoading] = React.useState(false);
  const { setAuthData } = authenStore();
  const { loginUser } = useUsersStore();
  const toast = React.useRef<Toast>(null);
  const router = useRouter();
  const { control, watch, setValue, register, handleSubmit, formState: { errors }, reset,
  } = useForm<LoginInput>(
    {
      resolver: zodResolver(LoginSchema),
      // defaultValues: defaultRowItem,
    }
  );
  // 🧨 แสดงข้อความ Toast
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
  const onSummit: SubmitHandler<LoginInput> = async (data) => {
    try {
      setLoading(true);
      const resp: any = await loginUser(data);
      if (resp.status == 201 || resp.status === 200) {
        showMessage("success", "ຂໍຄວາມກະລຸນາ", "ສຳເລັດ");
        setAuthData(resp?.data?.data);
        setTimeout(() => {
          router.push('/');
          setLoading(false);
        }, 800);

      }


    } catch (error : any) {
      showMessage("warn", `${error?.message}`, `${error?.message}`);
      setLoading(false);
    }


  }


  return (

    <form id="LoginForm" onSubmit={handleSubmit(onSummit)}>
      {errors?.username?.message}

      <InputText
        {...register('username')}
        id="username"
        type="text"
        placeholder="Enter your ID"
        className={classNames('w-full mb-5', { 'p-invalid': errors.username })}
        style={{ padding: '1rem', borderRadius: '10px', height: "2.5rem" }}
      />
      {errors?.password?.message? <span style={{ color: "red" }}> ປ້ອນລະຫັດ </span> : " " }
      <Controller
        name="password"
        control={control}
        render={({ field: { value, onChange } }) => (
          <Password
            value={value}
            onChange={onChange}
            placeholder="Password"
            toggleMask
            feedback={false}
            className={classNames('w-full mb-5', { 'p-invalid': errors.password })}
            inputStyle={{ borderRadius: '10px', height: "2.5rem" }}
            inputClassName="w-full p-3"
          />
        )}
      />
      <Button
        loading={isLoading}
        label="ເຂົ້າລະບົບ"
        form="LoginForm"
        type="submit"
      />
    </form>
  );
}
