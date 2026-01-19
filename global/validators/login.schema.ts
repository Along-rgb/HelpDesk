import { z } from 'zod';

// form zod validation schema
export const LoginSchema = z.object({
  username: z.string().min(5, 'ກະລຸນາ ໃສ່ລະຫັດພະນັກງານ'),
  password: z.string().min(3, 'ກະລຸນາປ້ອນລະຫັດຜ່ານ'),
});
export type LoginInput = z.infer<typeof LoginSchema>;