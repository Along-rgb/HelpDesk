// app/(main)/uikit/ticket/ticketData.ts
import { Ticket } from './types';

export const TICKET_MOCK_DATA: Ticket[] = [
  // หมวด GroupProblem - PHONE (ການສື່ສານ)
  {
    id: 't1',
    categoryId: 'PHONE',
    title: 'ລະບົບໂທລະສັບບໍ່ໄດ້',
    description: 'ແກ້ໄຂບັນຫາລະບົບໂທລະສັບພາຍໃນ ແລະ ພາຍນອກບໍ່ສາມາດໂທອອກໄດ້',
    icon: 'pi pi-ticket',
  },
  {
    id: 't2',
    categoryId: 'PHONE',
    title: 'ໂທບໍ່ຮັບ',
    description: 'ໂທຫາພະນັກງານບໍ່ຮັບສາຍໃນ ຫຼື ສາຍນອກ',
    icon: 'pi pi-ticket',
  },
  // หมวด GroupProblem - NET
  {
    id: 't3',
    categoryId: 'NET',
    title: 'ອິນເຕີເນັດຊ້ານ ຫຼື ບໍ່ເຊື່ອມຕໍ່',
    description: 'ບັນຫາການເຊື່ອມຕໍ່ອິນເຕີເນັດ ແລະ ເນັດເວີກ',
    icon: 'pi pi-ticket',
  },
  {
    id: 't4',
    categoryId: 'NET',
    title: 'ຕິດຕັ້ງເຄື່ອງຈັບສັນຍານ',
    description: 'ຂໍຕິດຕັ້ງ ຫຼື ປັບແຕ່ງອຸປະກອນເຄື່ອງຈັບສັນຍານ',
    icon: 'pi pi-ticket',
  },
  // หมวด GroupProblem - IT
  {
    id: 't5',
    categoryId: 'IT',
    title: 'ຄອມພີວເຕີເຮັດວຽກບໍ່ໄດ້',
    description: 'ອຸປະກອນຄອມພີວເຕີ ຫຼື ຮາດແວຊ້ຳ ຕ້ອງການການສ້ອມແປງ',
    icon: 'pi pi-ticket',
  },
  {
    id: 't6',
    categoryId: 'IT',
    title: 'ຂໍເບີກອຸປະກອນໄອທີ',
    description: 'ຂໍເບີກຄອມພີວເຕີ ໂມນິເຕີ ຫຼື ອຸປະກອນອື່ນໆ',
    icon: 'pi pi-ticket',
  },
  // หมวด GroupServices - SerCOM
  {
    id: 't7',
    categoryId: 'SerCOM',
    title: 'ບໍລິການຄອມພີວເຕີທົ່ວໄປ',
    description: 'ຂໍບໍລິການ ຫຼື ເບີກອຸປະກອນໄອທີຕ່າງໆ',
    icon: 'pi pi-ticket',
  },
  {
    id: 't8',
    categoryId: 'SerCOM',
    title: 'ຕິດຕັ້ງອຸປະກອນໃໝ່',
    description: 'ຂໍຕິດຕັ້ງຄອມພີວເຕີ ຫຼື ອຸປະກອນຮາດແວໃໝ່',
    icon: 'pi pi-ticket',
  },
  // หมวด GroupServices - SerSOFT
  {
    id: 't9',
    categoryId: 'SerSOFT',
    title: 'ຂໍຕິດຕັ້ງໂປຣແກຣມ',
    description: 'ຕິດຕັ້ງ ຫຼື ອັບເດດໂປຣແກຣມຕ່າງໆ',
    icon: 'pi pi-ticket',
  },
  {
    id: 't10',
    categoryId: 'SerSOFT',
    title: 'ຂໍສິດການເຂົ້າເຖິງລະບົບ',
    description: 'ຂໍ License ຫຼື ສິດການເຂົ້າເຖິງລະບົບພາຍໃນ',
    icon: 'pi pi-ticket',
  },
  // หมวด GroupServices - SerOTHER
  {
    id: 't11',
    categoryId: 'SerOTHER',
    title: 'ບໍລິການອື່ນໆ',
    description: 'ຕິດຕໍ່ສອບຖາມ ຫຼື ຂໍຄວາມຊ່ວຍເຫຼືອດ້ານບໍລິການ',
    icon: 'pi pi-ticket',
  },
];

/** ດຶງລາຍການ Ticket ຕາມ categoryId */
export function getTicketsByCategory(categoryId: string): Ticket[] {
  return TICKET_MOCK_DATA.filter((t) => t.categoryId === categoryId);
}

/** ດຶງ Ticket ຕາມ id (ໃຊ້ໃນ invalidstate ເພື່ອເອີ້ນຫົວຂໍ້ທີ່ເລືອກ) */
export function getTicketById(id: string): Ticket | undefined {
  return TICKET_MOCK_DATA.find((t) => t.id === id);
}

/** ນັບຈຳນວນ Ticket ຕໍ່ຫມວດໝູ່ (ໃຊ້ໃນ GroupProblem / GroupServices ເພີ່ມຈຳນວນລາຍການ) */
export function getTicketCountByCategory(categoryId: string): number {
  return TICKET_MOCK_DATA.filter((t) => t.categoryId === categoryId).length;
}
