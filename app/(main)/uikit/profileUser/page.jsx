'use client';
import React from 'react';
import './Profile.css';
import FormInput from './components/FormInput';
import FormDropdown from './components/FormDropdown';
import { useProfile } from './hooks/useProfile';

const ProfilePage = () => {
  // เรียกใช้ Logic จาก Hook (บรรทัดเดียวจบ)
  const { 
    loading, error, isSaving, isEditing, 
    formData, masterData, 
    handleChange, handleDropdownChange, handleToggleEdit, handleSave 
  } = useProfile();

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{color:'red', textAlign:'center'}}>{error}</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>ຕັ້ງຄ່າຂໍ້ມູນສ່ວນຕົວ</h2>
      </div>

      <div className="profile-form">
        {/* Row 1: Basic Info */}
        <div className="form-row three-cols">
          <FormInput 
            label="ລະຫັດພະນັກງານ" 
            value={formData.employeeId} 
            disabled={true} 
            readOnly={true} 
          />
          <FormInput 
            label="ຊື່ແທ້" name="firstName"
            value={formData.firstName} onChange={handleChange} disabled={!isEditing} 
          />
          <FormInput 
            label="ນາມສະກຸນ" name="lastName"
            value={formData.lastName} onChange={handleChange} disabled={!isEditing} 
          />
        </div>

        {/* Row 2: Department Info */}
        <div className="form-row two-cols">
          <FormDropdown 
            label="ຝ່າຍ" name="department"
            value={formData.department} onChange={handleDropdownChange}
            options={masterData.departments} disabled={!isEditing} showClear={isEditing}
          />
          <FormDropdown 
            label="ພະແນກ/ສູນ/ສາຂາ" name="division"
            value={formData.division} onChange={handleDropdownChange}
            options={masterData.divisions} disabled={!isEditing} showClear={isEditing}
          />
        </div>

        {/* Row 3: Position & Email */}
        <div className="form-row two-cols">
          <FormDropdown 
            label="ຕຳແໜ່ງ" name="position"
            value={formData.position} onChange={handleDropdownChange}
            options={masterData.positions} disabled={!isEditing} showClear={isEditing}
          />
          <FormInput 
            label="ອີເມວ" name="email" type="email"
            value={formData.email} onChange={handleChange} disabled={!isEditing} 
          />
        </div>

        {/* Row 4: Contact Info */}
        <div className="form-row two-cols">
          <FormInput 
            label="ເບີໂທຕິດຕໍ່" name="contactPhone"
            value={formData.contactPhone} onChange={handleChange} disabled={!isEditing} 
          />
          <FormInput 
            label="ເບີແອັບ" name="homePhone"
            value={formData.appPhone} onChange={handleChange} disabled={!isEditing} 
          />
        </div>
      </div>

      <div className="profile-footer">
        <button 
          className="btn-edit" 
          onClick={handleToggleEdit} 
          disabled={isSaving}
          style={isEditing ? { borderColor: '#d32f2f', color: '#d32f2f' } : {}}
        >
          <i className={`pi ${isEditing ? 'pi-times' : 'pi-pencil'}`} style={{marginRight:'5px'}}></i> 
          {isEditing ? 'ຍົກເລີກ' : 'ແກ້ໄຂ'}
        </button>

        <button 
          className="btn-save" 
          onClick={handleSave} 
          disabled={!isEditing || isSaving}
        >
          <i className="pi pi-check" style={{marginRight:'5px'}}></i> ບັນທືກ
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;