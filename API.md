 มี  API  คือ  https://api-test.edl.com.la/helpdesk/api/
 โดย endpoint  แต่ละตัวจะมีและ ประกาดตามนี้
  Role 1 (SuperAdmin)
  สี่งที่ทำได้จะมี:
  /api/users
    {
        "id": 5,
        "username": "44348",
        "employeeId": 20,
        "roleId": 4,
        "role": {
            "id": 4,
            "name": "User",
            "description": ""
        },
        "employee": {
            "id": 20,
            "first_name": "ທະວີສັກ",
            "last_name": "ເທບສົມບັດ",
            "emp_code": "44348",
            "status": "A",
            "gender": "Male",
            "tel": "56096626",
            "email": null,
            "empimg": null,
            "posId": 94,
            "departmentId": 1,
            "divisionId": 95,
            "officeId": null,
            "unitId": 340,
            "createdAt": "2026-02-09T08:26:53.000Z",
            "updatedAt": "2026-02-20T16:42:41.000Z",
            "department": {
                "id": 1,
                "department_name": "ຫ້ອງການໄຟຟ້າລາວ",
                "department_code": "201",
                "department_status": "A"
            },
            "division": {
                "id": 95,
                "division_name": "ພະແນກຄົ້ນຄວ້າ-ສັງລວມ (ຫ້ອງການ ຟຟລ)",
                "division_code": "20101",
                "division_status": "A",
                "branch_id": 1,
                "departmentId": 1
            },
            "office": null,
            "unit": {
                "id": 340,
                "unit_name": "ໜ່ວຍງານຄົ້ນຄວ້າ",
                "unit_code": "2010101",
                "unit_status": "A",
                "unit_type": "ໜ່ວຍງານສຳນັກງານໃຫຍ່",
                "divisionId": 95,
                "officeId": null
            },
            "position": {
                "id": 94,
                "pos_name": "ວິຊາການຫນຸ່ມນ້ອຍ",
                "pos_status": "A",
                "poscodeId": 82
            }
        }
    }

    /api/employees
     {
        "id": 1,
        "first_name": "ສອນເພັດ",
        "last_name": "ໂສພາກຸນ",
        "emp_code": "40707",
        "status": "A",
        "gender": "Male",
        "tel": "020 22880223",
        "email": null,
        "empimg": "https://hrm.edl.com.la/api_v2/organization-svc/employee/getEmpImg/40707/f01102010010f291258db92ef10a42bf1010ba.jpg",
        "posId": 95,
        "departmentId": 1,
        "divisionId": 99,
        "officeId": null,
        "unitId": 205,
        "createdAt": "2026-02-09T08:26:53.000Z",
        "updatedAt": "2026-02-20T16:42:41.000Z"
    }

    /api/departments
      {
        "id": 1,
        "department_name": "ຫ້ອງການໄຟຟ້າລາວ",
        "department_code": "201",
        "department_status": "A"
    }

    /api/divisions
    {
        "id": 1,
        "division_name": "ບໍລິສັດ ເຂື່ອນໄຟຟ້າເຊລະນອງ 1",
        "division_code": "202060112",
        "division_status": "A",
        "branch_id": 1,
        "departmentId": 9
    }

    /api/offices
     {
        "id": 5,
        "office_name": "ຫ້ອງການກວດກາ",
        "office_code": "2100601",
        "office_status": "A",
        "divisionId": 185
    }

    /api/units
    {
        "id": 91,
        "unit_name": "ໜ່ວຍງານພັກ",
        "unit_code": "2020201",
        "unit_status": "A",
        "unit_type": "ໜ່ວຍງານສຳນັກງານໃຫຍ່",
        "divisionId": 88,
        "officeId": null
    }

    /api/positiongroups
      {
        "id": 1,
        "pos_group_name": "A1"
    }

    /api/positioncodes
     {
        "id": 1,
        "pos_code_name": "A1.1",
        "pos_code_status": "A",
        "posgroupId": 1
    }

    /api/positions
     {
        "id": 1,
        "pos_name": "ວິຊາການ B06",
        "pos_status": "A",
        "poscodeId": 73
    }

    /api/roles
     {
        "id": 1,
        "name": "SuperAdmin",
        "description": ""
    }

    /api/buildings         ; ##  role 1 สามาตรเลือก  ติก/อาคาร,  แก้ไข , บันทึก ได้
      {
        "id": 1,
        "name": "ຕຶກສຳນັກງານໃຫຍ່ ຟຟລ"
    }
    
    /api/floors           ; ##  role 1 สามาตรเลือก  ชั้น,  แก้ไข , บันทึก ได้
     {
        "id": 3,
        "buildingId": 1,
        "name": "ຊັ້ນ-01",
        "building": {
            "id": 1,
            "name": "ຕຶກສຳນັກງານໃຫຍ່ ຟຟລ"
        }
    }

     /api/turnings      ; ##  role 1 สามาตรเลือก  ทิดทาง,  แก้ไข , บันทึก ได้
     {
        "id": 1,
        "name": "ລ້ຽວຊ້າຍ"
    }

    /api/helpdeskstatus     ; ##  role 1 สามาตรเลือก  สะภานะ,  แก้ไข , บันทึก , ลบ ได้
    {
        "id": 1,
        "name": "ລໍຖ້າຮັບວຽກ"
    }

    /api/prioritys       ; ##  role 1 สามาตรเลือก  ละดับความสำคัญ,  แก้ไข , บันทึก , ลบ ได้
    {
        "id": 1,
        "name": "ທຳມະດາ"
    }

    /api/headcategorys    ; ##  role 1 สามาตรเลือก  หัวข้อเรื่อง,  แก้ไข , บันทึก, ลบ ได้
     {
        "id": 2,
        "name": "ພະແນກສູນຂໍ້ມູນ",
        "description": "ສ້ອມແປງຄອມ ແລະ ອຸປະກອນທົ່ວໄປທີ່ກ່ຽວກັບຄອມພີວເຕີ",
        "departmentId": 22,
        "divisionId": 128,
        "createdAt": "2026-02-21T22:00:26+07:00",
        "updatedAt": "2026-02-23T13:52:32+07:00",
        "department": {
            "id": 22,
            "department_name": "ຝ່າຍເຕັກໂນໂລຊີ ການສື່ສານ ຂໍ້ມູນຂ່າວສານ",
            "department_code": "213",
            "department_status": "A"
        },
        "division": {
            "id": 128,
            "division_name": "ພະແນກຄຸ້ມຄອງສູນຂໍ້ມູນ-ລະບົບຄອມພິວເຕີ",
            "division_code": "21303",
            "division_status": "A",
            "branch_id": 1,
            "departmentId": 22
        }
    }

     /api/headcategorys     ตอน บันทึก
     {
    "name": "ພະແນກສູນຂໍ້ມູນ",
    "description": "ສ້ອມແປງຄອມ",
    "departmentId": 22,
    "divisionId": 128
     }

      /api/headcategorys/id     ตอน แก้ไข
      {
    "name": "ພະແນກສູນຂໍ້ມູນ3434",
    "description": "ສ້ອມແປງຄອມ5353",
    "departmentId": 22,
    "divisionId": 128
      }

      /api/headcategorys/selectheadcategory  ตอน เลือก
       {
        "id": 2,
        "name": "ພະແນກສູນຂໍ້ມູນ",
        "description": "ສ້ອມແປງຄອມ ແລະ ອຸປະກອນທົ່ວໄປທີ່ກ່ຽວກັບຄອມພີວເຕີ",
        "departmentId": 22,
        "divisionId": 128,
        "createdAt": "2026-02-21T15:00:26.000Z",
        "updatedAt": "2026-02-23T06:52:32.000Z"
    }

    /api/categorys/selectcategory    ; ## role 1  ทำได้แค่เลือก ใน endpoint : /api/categorys 
     {
        "id": 10,
        "headCategoryId": 2,
        "title": "ແປງ excel",
        "description": "ເປັນ excel ທີ່ເປີດບໍ່ໄດ້",
        "catIconId": null,
        "createdAt": "2026-02-22T15:46:02.000Z",
        "updatedAt": "2026-02-22T15:46:02.000Z",
        "createdById": 466,
        "headCategory": {
            "id": 2,
            "name": "ພະແນກສູນຂໍ້ມູນ",
            "description": "ສ້ອມແປງຄອມ ແລະ ອຸປະກອນທົ່ວໄປທີ່ກ່ຽວກັບຄອມພີວເຕີ",
            "departmentId": 22,
            "divisionId": 128,
            "createdAt": "2026-02-21T15:00:26.000Z",
            "updatedAt": "2026-02-23T06:52:32.000Z"
        },
        "catIcon": null
    }

    /api/categoryicons       ; ##  role 1 สามาตรเลือก  icon รูป,  แก้ไข , บันทึก, ลบ ได้
     {
        "id": 3,
        "catIcon": "1771873463972-136540407.png"
    }

    /api/categoryicons   ;  ## ตอน บันทึก
     เป็น  form-data 
     key : catIcon
     value: file รูป 
     เป็น json 
     {
        "id": 3,
        "catIcon": "1771873463972-136540407.png"
    }
      
    /api/tickets/selectticket?categoryId=10    ; ## role 1  ทำได้แค่เลือก ใน endpoint : /api/tickets 
    {
        "id": 10,
        "categoryId": 10,
        "title": "Harddisk ຕາຍ",
        "description": "ຂໍ້ມູນບໍ່ເກັບ",
        "createdAt": "2026-02-22T15:47:22.000Z",
        "updatedAt": "2026-02-22T15:47:22.000Z",
        "createdById": 466,
        "category": {
            "id": 10,
            "headCategoryId": 2,
            "title": "ແປງ excel",
            "description": "ເປັນ excel ທີ່ເປີດບໍ່ໄດ້",
            "catIconId": null,
            "createdAt": "2026-02-22T15:46:02.000Z",
            "updatedAt": "2026-02-22T15:46:02.000Z",
            "createdById": 466
        },
        "createdBy": {
            "id": 466,
            "employee": {
                "id": 5325,
                "first_name": "ດາລີສັກ",
                "last_name": "ສົມສະໝຸດ",
                "gender": "Male"
            }
        }
    }

    role 2 (Admin)
    สี่งที่ Admin  หรือ  role 2  สามาตรทำได้ เช่น add , update, delete , select ได้ จะมี

    /api/categorys   
      {
        "id": 10,
        "headCategoryId": 2,
        "title": "ແປງ excel",
        "description": "ເປັນ excel ທີ່ເປີດບໍ່ໄດ້",
        "catIconId": null,
        "createdAt": "2026-02-22T22:46:02+07:00",
        "updatedAt": "2026-02-22T22:46:02+07:00",
        "createdById": 466,
        "headCategory": {
            "id": 2,
            "name": "ພະແນກສູນຂໍ້ມູນ",
            "description": "ສ້ອມແປງຄອມ ແລະ ອຸປະກອນທົ່ວໄປທີ່ກ່ຽວກັບຄອມພີວເຕີ",
            "departmentId": 22,
            "divisionId": 128,
            "createdAt": "2026-02-21T15:00:26.000Z",
            "updatedAt": "2026-02-23T06:52:32.000Z"
        },
        "catIcon": null
    }

    /api/categorys
    {
    "title": "ແປງ excel",
    "description": "ເປັນ excel ທີ່ເປີດບໍ່ໄດ້",
    "catIconId": 1
    }

    /api/tickets    ตอน GetAll
     {
        "id": 10,
        "categoryId": 10,
        "title": "Harddisk ຕາຍ",
        "description": "ຂໍ້ມູນບໍ່ເກັບ",
        "createdAt": "2026-02-22T22:47:22+07:00",
        "updatedAt": "2026-02-22T22:47:22+07:00",
        "createdById": 466,
        "category": {
            "id": 10,
            "title": "ແປງ excel",
            "description": "ເປັນ excel ທີ່ເປີດບໍ່ໄດ້"
        },
        "createdBy": {
            "id": 466,
            "employee": {
                "id": 5325,
                "first_name": "ດາລີສັກ",
                "last_name": "ສົມສະໝຸດ",
                "gender": "Male"
            }
        }
    }

    /api/tickets      ; ## ตอน บันทึก
    {
    "categoryId": 4,
    "title": "Harddisk ຕາຍ",
    "description": "ຂໍ້ມູນບໍ່ເກັບ"
   }

   /api/tickets/selectticket?categoryId=10    ;  ตอนเลือก 
   {
        "id": 10,
        "categoryId": 10,
        "title": "Harddisk ຕາຍ",
        "description": "ຂໍ້ມູນບໍ່ເກັບ",
        "createdAt": "2026-02-22T15:47:22.000Z",
        "updatedAt": "2026-02-22T15:47:22.000Z",
        "createdById": 466,
        "category": {
            "id": 10,
            "headCategoryId": 2,
            "title": "ແປງ excel",
            "description": "ເປັນ excel ທີ່ເປີດບໍ່ໄດ້",
            "catIconId": null,
            "createdAt": "2026-02-22T15:46:02.000Z",
            "updatedAt": "2026-02-22T15:46:02.000Z",
            "createdById": 466
        },
        "createdBy": {
            "id": 466,
            "employee": {
                "id": 5325,
                "first_name": "ດາລີສັກ",
                "last_name": "ສົມສະໝຸດ",
                "gender": "Male"
            }
        }
    }

   endpoint  ที่ role 2  สามาตรดู (GetAll)  ได้อย่างเดียวไม่มีแก้ไข หรือ สามาตรเพี่มได้ แต่  role 1  ทำอะไร ไม่ได้เลย แม้แต่ดูได้
      
      /api/users/admin
      {
        "id": 466,
        "username": "39879",
        "employeeId": 5325,
        "roleId": 2,
        "role": {
            "id": 2,
            "name": "Admin",
            "description": ""
        },
        "employee": {
            "id": 5325,
            "first_name": "ດາລີສັກ",
            "last_name": "ສົມສະໝຸດ",
            "emp_code": "39879",
            "status": "A",
            "gender": "Male",
            "tel": "20 5995 1199 ",
            "email": "dalysak.sm@gmail.com",
            "empimg": "https://hrm.edl.com.la/api_v2/organization-svc/employee/getEmpImg/39879/d106cc812ff02d673f3b21038cafb7ad15.jpg",
            "posId": 99,
            "departmentId": 22,
            "divisionId": 128,
            "officeId": null,
            "unitId": null,
            "createdAt": "2026-02-09T08:26:53.000Z",
            "updatedAt": "2026-02-20T16:42:41.000Z",
            "department": {
                "id": 22,
                "department_name": "ຝ່າຍເຕັກໂນໂລຊີ ການສື່ສານ ຂໍ້ມູນຂ່າວສານ",
                "department_code": "213",
                "department_status": "A"
            },
            "division": {
                "id": 128,
                "division_name": "ພະແນກຄຸ້ມຄອງສູນຂໍ້ມູນ-ລະບົບຄອມພິວເຕີ",
                "division_code": "21303",
                "division_status": "A",
                "branch_id": 1,
                "departmentId": 22
            },
            "office": null,
            "unit": null,
            "position": {
                "id": 99,
                "pos_name": "ຮອງຫົວໜ້າພະແນກ",
                "pos_status": "A",
                "poscodeId": 25
            }
        }
    }

    /api/users/adminassign
      {
        "id": 469,
        "username": "41630",
        "employeeId": 5329,
        "roleId": 3,
        "role": {
            "id": 3,
            "name": "Staff",
            "description": ""
        },
        "employee": {
            "id": 5329,
            "first_name": "ທະນູຄຳ",
            "last_name": "ວັນລາສີ",
            "emp_code": "41630",
            "status": "A",
            "gender": "Male",
            "tel": "02052500939",
            "email": "thanoukham42@gmail.com",
            "empimg": null,
            "posId": 51,
            "departmentId": 22,
            "divisionId": 128,
            "officeId": null,
            "unitId": 1047,
            "createdAt": "2026-02-09T08:26:53.000Z",
            "updatedAt": "2026-02-20T16:42:41.000Z",
            "department": {
                "id": 22,
                "department_name": "ຝ່າຍເຕັກໂນໂລຊີ ການສື່ສານ ຂໍ້ມູນຂ່າວສານ",
                "department_code": "213",
                "department_status": "A"
            },
            "division": {
                "id": 128,
                "division_name": "ພະແນກຄຸ້ມຄອງສູນຂໍ້ມູນ-ລະບົບຄອມພິວເຕີ",
                "division_code": "21303",
                "division_status": "A",
                "branch_id": 1,
                "departmentId": 22
            },
            "office": null,
            "unit": {
                "id": 1047,
                "unit_name": "ໜ່ວຍງານສ້ອມແປງອຸປະກອນ (Hardware)",
                "unit_code": "2130302",
                "unit_status": "A",
                "unit_type": "ໜ່ວຍງານສຳນັກງານໃຫຍ່",
                "divisionId": 128,
                "officeId": null
            },
            "position": {
                "id": 51,
                "pos_name": "ຮອງຫົວໜ້າ ໜ່ວຍງານ",
                "pos_status": "A",
                "poscodeId": 52
            }
        }
    }

