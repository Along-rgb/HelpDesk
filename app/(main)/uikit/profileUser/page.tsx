'use client';

/**
 * หน้า Profile — แสดงข้อมูลของคนที่ login เท่านั้น (read-only).
 * ຕຳແໜ່ງ, ຝ່າຍ, ພະແນກ/ສູນ/ສາຂາ, ໜ່ວຍງານ ดึงจาก profileData (GET /users/:id) เท่านั้น ไม่เรียก endpoint อื่น.
 */
import React from 'react';
import './Profile.css';
import FormInput from './components/FormInput';
import { useProfile } from './hooks/useProfile';
import { Card } from 'primereact/card';
import { UserProfileHeader } from '../MainBoard/UserProfileHeader';

const ProfilePage = () => {
  const { loading, error, profileData } = useProfile();

  if (loading) {
    return (
      <div className="profile-container">
        <div className="text-center py-8">
          <i className="pi pi-spin pi-spinner" style={{ fontSize: '3rem' }}></i>
          <p className="mt-3">ກຳລັງໂຫຼດຂໍ້ມູນ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div style={{ color: 'red', textAlign: 'center', padding: '2rem' }}>
          <i className="pi pi-exclamation-triangle" style={{ fontSize: '3rem' }}></i>
          <p className="mt-3">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <UserProfileHeader
        fullName={profileData?.fullName ?? 'User'}
        role={profileData?.pos_name}
        avatarUrl={profileData?.empimg}
      />

      <Card className="mb-4">
        <h3 className="mb-3">
          <i className="pi pi-info-circle mr-2"></i>
          ຂໍ້ມູນພະນັກງານ
        </h3>

        <div className="profile-form">
          <div className="form-row three-cols">
            <FormInput
              label="ລະຫັດພະນັກງານ "
              value={profileData?.emp_code || ''}
              disabled
              readOnly
            />
            <FormInput
              label="ຊື່ແທ້ "
              value={profileData?.first_name || ''}
              disabled
              readOnly
            />
            <FormInput
              label="ນາມສະກຸນ "
              value={profileData?.last_name || ''}
              disabled
              readOnly
            />
          </div>

          <div className="form-row two-cols">
            <FormInput
              label="ຝ່າຍ "
              value={profileData?.department_name || ''}
              disabled
              readOnly
            />
            <FormInput
              label="ພະແນກ/ສູນ/ສາຂາ "
              value={profileData?.division_name || ''}
              disabled
              readOnly
            />
          </div>

          <div className="form-row two-cols">
            <FormInput
              label="ຕຳແໜ່ງ "
              value={profileData?.pos_name || ''}
              disabled
              readOnly
            />
            <FormInput
              label="ໜ່ວຍງານ "
              value={profileData?.unit_name || ''}
              disabled
              readOnly
            />
          </div>

          <div className="form-row two-cols">
            <FormInput
              label="ເບີໂທຕິດຕໍ່"
              value={profileData?.tel || ''}
              disabled
              readOnly
            />
            <FormInput
              label="ອີເມວ "
              value={profileData?.email ?? ''}
              disabled
              readOnly
            />
          </div>

          <div className="form-row two-cols">
            <FormInput
              label="ເພດ"
              value={profileData?.gender || ''}
              disabled
              readOnly
            />
            <FormInput
              label="ສະຖານະ"
              value={profileData?.status === 'A' ? 'ປົກກະຕິ' : profileData?.status || ''}
              disabled
              readOnly
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
