'use client';

import React, { useState, useRef } from 'react';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { changePasswordAPI, validateForm } from './api';

const ChangePasswordPage = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const toast = useRef<Toast>(null);
  const isSubmittingRef = useRef(false);

  // ✅ แก้ไขฟังก์ชันนี้: เพิ่ม .clear() เพื่อลบข้อความเก่าก่อนเสมอ
  const showToast = (severity: 'success' | 'error' | 'warn', summary: string, detail: string) => {
    toast.current?.clear(); // 👈 สั่งลบอันเก่าทิ้งทันที! จะได้ไม่ซ้อนกัน
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. เช็คดักทาง: ถ้ากดซ้ำมา ให้แจ้งเตือนและล้าง Toast เก่าออก
    if (isSubmittingRef.current) {
      showToast('warn', 'ແຈ້ງເຕືອນ (Warning)', 'ກະລຸນາຢ່າກົດຊ້ຳ !! (Please do not click repeatedly)');
      return;
    }

    // 2. ล็อคปุ่มทันที
    isSubmittingRef.current = true;
    setIsLoading(true);

    const validation = validateForm(formData);
    if (!validation.isValid) {
      showToast('warn', 'ແຈ້ງເຕືອນ (Warning)', validation.message);
      
      setIsLoading(false);
      // หน่วงเวลาปลดล็อคเล็กน้อย (500ms)
      setTimeout(() => { isSubmittingRef.current = false; }, 500); 
      return;
    }

    try {
      await changePasswordAPI(formData);
      showToast('success', 'ສຳເລັດ (Success)', 'ປ່ຽນລະຫັດຜ່ານສຳເລັດ!');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      showToast('error', 'ເກີດຂໍ້ຜິດພາດ (Error)', error.message);
    } finally {
      setIsLoading(false);
      setTimeout(() => { isSubmittingRef.current = false; }, 500);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      
      {/* Position Top Center ตามที่ขอ */}
      <Toast ref={toast} position="top-center" />

      <h2 style={{ marginBottom: '1.5rem' }}>ຕັ້ງຄ່າລະຫັດຜ່ານ</h2>

      <form onSubmit={handleSubmit} className="flex flex-column gap-3">
        
        <div className="field">
          <label htmlFor="currentPassword" style={{ display: 'block', marginBottom: '0.5rem' }}>
            ລະຫັດຜ່ານປະຈຸບັນ
          </label>
          <Password
            id="currentPassword"
            value={formData.currentPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
            feedback={false}
            toggleMask
            disabled={isLoading}
            className="w-full"
            inputStyle={{ width: '100%' }}
            placeholder=""
          />
        </div>

        <div className="field">
          <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '0.5rem', marginTop: '1rem' }}>
            ລະຫັດຜ່ານໃໝ່
          </label>
          <Password
            id="newPassword"
            value={formData.newPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
            toggleMask
            disabled={isLoading}
            className="w-full"
            inputStyle={{ width: '100%' }}
            promptLabel="ກະລຸນາໃສ່ລະຫັດຜ່ານ"
            weakLabel="ອ່ອນ (Weak)"
            mediumLabel="ປານກາງ (Medium)"
            strongLabel="ດີຫຼາຍ (Strong)"
          />
        </div>

        <div className="field">
          <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem', marginTop: '1rem' }}>
            ຢືນຢັນລະຫັດຜ່ານໃໝ່
          </label>
          <Password
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            feedback={false}
            toggleMask
            disabled={isLoading}
            className="w-full"
            inputStyle={{ width: '100%' }}
          />
        </div>

        <Button
          type="submit"
          label={isLoading ? 'ກຳລັງບັນທຶກ...' : 'ປ່ຽນລະຫັດຜ່ານ'}
          icon="pi pi-check"
          loading={isLoading}
          disabled={isLoading} 
          className="w-full mt-4"
        />
      </form>
    </div>
  );
};

export default ChangePasswordPage;