'use client';

import React from 'react';
import './Profile.css';
import FormInput from './components/FormInput';
import FormDropdown from './components/FormDropdown';
import { useProfile } from './hooks/useProfile';
import { Avatar } from 'primereact/avatar';
import { Card } from 'primereact/card';

const ProfilePage = () => {
  const {
    loading,
    error,
    isSaving,
    isEditing,
    formData,
    profileData,
    masterData,
    handleChange,
    handleDropdownChange,
    handleToggleEdit,
    handleSave,
  } = useProfile();

  // =========================================
  // Loading & Error States
  // =========================================
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

  // =========================================
  // Profile Display
  // =========================================
  return (
    <div className="profile-container">
      {/* Header with Avatar */}
      <div className="profile-header">
        <div className="flex align-items-center gap-4">
          <Avatar
            image={profileData?.empimg || '/layout/images/avatar-default.png'}
            size="xlarge"
            shape="circle"
            className="profile-avatar shadow-2"
          />
          <div>
            <h2 className="m-0">{profileData?.fullName || 'User'}</h2>
            <p className="text-500 mt-1">{profileData?.pos_name}</p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="mb-4">
        <h3 className="mb-3">
          <i className="pi pi-info-circle mr-2"></i>
          ຂໍ້ມູນພະນັກງານ
        </h3>

        <div className="profile-form">
          {/* Row 1: Basic Info */}
          <div className="form-row three-cols">
            <FormInput
              label="ລະຫັດພະນັກງານ "
              value={profileData?.emp_code || ''}
              disabled={true}
              readOnly={true}
            />
            <FormInput
              label="ຊື່ແທ້ "
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <FormInput
              label="ນາມສະກຸນ "
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          {/* Row 2: Organization Info - ຝ່າຍ, ພະແນກ (Dropdown + search + clear) */}
          <div className="form-row two-cols">
            <FormDropdown
              label="ຝ່າຍ "
              name="departmentId"
              value={formData.departmentId ?? undefined}
              options={masterData.departmentOptions}
              onChange={handleDropdownChange}
              disabled={!isEditing}
              showClear
              filter
            />
            <FormDropdown
              label="ພະແນກ/ສູນ/ສາຂາ "
              name="divisionId"
              value={formData.divisionId ?? undefined}
              options={masterData.divisionOptions}
              onChange={handleDropdownChange}
              disabled={!isEditing}
              showClear
              filter
            />
          </div>

          {/* Row 3: Position & Unit - ຕຳແໜ່ງ (Dropdown [pos_code_name]-pos_name) */}
          <div className="form-row two-cols">
            <FormDropdown
              label="ຕຳແໜ່ງ "
              name="posId"
              value={formData.posId ?? undefined}
              options={masterData.positionOptions}
              onChange={handleDropdownChange}
              disabled={!isEditing}
              showClear
              filter
            />
            <FormInput
              label="ໜ່ວຍງານ "
              value={profileData?.unit_name || ''}
              disabled={true}
              readOnly={true}
            />
          </div>

          {/* Row 4: Contact Info */}
          <div className="form-row two-cols">
            <FormInput
              label="ເບີໂທຕິດຕໍ່"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <FormInput
              label="ອີເມວ "
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          {/* Additional Info */}
          <div className="form-row two-cols">
            <FormInput
              label="ເພດ"
              value={profileData?.gender || ''}
              disabled={true}
              readOnly={true}
            />
            <FormInput
              label="ສະຖານະ"
              value={profileData?.status === 'A' ? 'ປົກກະຕິ' : profileData?.status || ''}
              disabled={true}
              readOnly={true}
            />
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="profile-footer">
        <button
          className="btn-edit"
          onClick={handleToggleEdit}
          disabled={isSaving}
          style={isEditing ? { borderColor: '#d32f2f', color: '#d32f2f' } : {}}
        >
          <i
            className={`pi ${isEditing ? 'pi-times' : 'pi-pencil'}`}
            style={{ marginRight: '5px' }}
          ></i>
          {isEditing ? 'ຍົກເລີກ' : 'ແກ້ໄຂ'}
        </button>

        <button
          className="btn-save"
          onClick={handleSave}
          disabled={!isEditing || isSaving}
        >
          {isSaving ? (
            <>
              <i className="pi pi-spin pi-spinner" style={{ marginRight: '5px' }}></i>
              ກຳລັງບັນທຶກ...
            </>
          ) : (
            <>
              <i className="pi pi-check" style={{ marginRight: '5px' }}></i>
              ບັນທືກ
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
