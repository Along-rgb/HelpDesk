'use client';

/**
 * ຕັ້ງຄ່າລະຫັດຜ່ານ — เข้าได้ทุก Role (SuperAdmin, Admin, Staff, User).
 */
import React, { useState, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { changePasswordAPI, validateForm } from './api';
import { useUserRoleAndId } from '@/app/store/user/userProfileStore';

const ChangePasswordPage = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useRef<Toast>(null);
  const isSubmittingRef = useRef(false);
  const { currentUserId } = useUserRoleAndId();

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
      if (!currentUserId) {
        showToast('error', 'ເກີດຂໍ້ຜິດພາດ (Error)', 'ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ ກະລຸນາ Login ໃໝ່');
        setIsLoading(false);
        setTimeout(() => { isSubmittingRef.current = false; }, 500);
        return;
      }
      await changePasswordAPI(formData, currentUserId);
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
          <label htmlFor="currentPassword" className="block mb-2">ລະຫັດຜ່ານປະຈຸບັນ</label>
          <span className="block w-full" style={{ position: 'relative' }}>
            <InputText
              id="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
              disabled={isLoading}
              autoComplete="current-password"
              className="w-full"
              style={{ height: '2.75rem', paddingRight: '2.5rem' }}
            />
            <i
              className={classNames('pi cursor-pointer', showCurrent ? 'pi-eye-slash' : 'pi-eye')}
              onClick={() => setShowCurrent(v => !v)}
              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', zIndex: 10 }}
            />
          </span>
        </div>

        <div className="field">
          <label htmlFor="newPassword" className="block mb-2">ລະຫັດຜ່ານໃໝ່</label>
          <span className="block w-full" style={{ position: 'relative' }}>
            <InputText
              id="newPassword"
              type={showNew ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
              disabled={isLoading}
              autoComplete="new-password"
              className="w-full"
              style={{ height: '2.75rem', paddingRight: '2.5rem' }}
            />
            <i
              className={classNames('pi cursor-pointer', showNew ? 'pi-eye-slash' : 'pi-eye')}
              onClick={() => setShowNew(v => !v)}
              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', zIndex: 10 }}
            />
          </span>
        </div>

        <div className="field">
          <label htmlFor="confirmPassword" className="block mb-2">ຢືນຢັນລະຫັດຜ່ານໃໝ່</label>
          <span className="block w-full" style={{ position: 'relative' }}>
            <InputText
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              disabled={isLoading}
              autoComplete="new-password"
              className="w-full"
              style={{ height: '2.75rem', paddingRight: '2.5rem' }}
            />
            <i
              className={classNames('pi cursor-pointer', showConfirm ? 'pi-eye-slash' : 'pi-eye')}
              onClick={() => setShowConfirm(v => !v)}
              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', zIndex: 10 }}
            />
          </span>
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