'use client';

import React from 'react';
// 1. Import Lottie
import Lottie from 'lottie-react';
// 2. Import ไฟล์ JSON ที่เราโหลดมา (สมมติว่าโหลดมาแล้ว)
// *หมายเหตุ: ใน Next.js App Router ถ้าไฟล์อยู่ใน public เราอาจจะต้อง fetch หรือ import แบบ require
import animationData from '../../../../public/layout/images/animation.json';

// *ถ้า import แบบข้างบนไม่ได้ (เพราะอยู่นอก src) ให้ย้ายไฟล์ json มาไว้ใน folder components หรือ src ชั่วคราว
// หรือใช้ URL แบบ Remote (ถ้ามี link)

const AboutPage = () => {
    return (
        <div className="grid justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <div className="col-12 md:col-10 lg:col-8">
                <div className="card p-5 text-center border-round-xl shadow-2 surface-card">

                    {/* ⭐ ส่วนแสดงผล Lottie Animation ⭐ */}
                    <div className="flex justify-content-center mb-5">
                        <div style={{ maxWidth: '500px', width: '100%' }}>
                            <Lottie
                                animationData={animationData}
                                loop={true}
                                autoplay={true}
                            />
                        </div>
                    </div>
                    <div className="px-3 md:px-6" >
                        <div style={{ letterSpacing: '1px' }}>
                            <h2 className="text-900 font-bold mb-4">
                                ຍິນດີຕ້ອນຮັບເຂົ້າສູ່ <span className="text-blue-600">ICT-HelpDesk</span>
                            </h2>

                            <p className="text-lg text-700 line-height-3 mb-4">
                                ລະບົບ <strong>HelpDesk</strong> ແມ່ນລະບົບທີ່ຖືກພັດທະນາຂຶ້ນເພື່ອອຳນວຍຄວາມສະດວກໃນການ
                                <span className="text-blue-600 font-bold"> ແຈ້ງບັນຫາ</span> ແລະ
                                <span className="text-green-600 font-bold">  ຕິດຕາມສະຖານະ </span>
                                ການແກ້ໄຂບັນຫາ ພາຍໃນອົງກອນ.
                            </p>
                        </div >
                        <div className="grid text-left mt-6">
                            <div className="col-12 md:col-4 mb-4 px-5">
                                <span className="p-3 shadow-2 mb-3 inline-block surface-card" style={{ borderRadius: '10px' }}>
                                    <i className="pi pi-desktop text-4xl text-blue-500"></i>
                                </span>
                                <div className="text-900 mb-3 font-medium">Paperless</div>
                                <span className="text-700 text-sm line-height-3">ຫຼຸດຜ່ອນການນຳໃຊ້ເຈ້ຍ ແລະ ປະຢັດຊັບພະຍາກອນ.</span>
                            </div>
                            <div className="col-12 md:col-4 mb-4 px-5">
                                <span className="p-3 shadow-2 mb-3 inline-block surface-card" style={{ borderRadius: '10px' }}>
                                    <i className="pi pi-bolt text-4xl text-yellow-500"></i>
                                </span>
                                <div className="text-900 mb-3 font-medium">ໄວ & ສະດວກ</div>
                                <span className="text-700 text-sm line-height-3">ວ່ອງໄວ, ງ່າຍດາຍ ແລະ ກວດສອບໄດ້ທຸກຂັ້ນຕອນ.</span>
                            </div>
                            <div className="col-12 md:col-4 mb-4 px-5">
                                <span className="p-3 shadow-2 mb-3 inline-block surface-card" style={{ borderRadius: '10px' }}>
                                    <i className="pi pi-shield text-4xl text-green-500"></i>
                                </span>
                                <div className="text-900 mb-3 font-medium">ມີຄວາມປອດໄພ</div>
                                <span className="text-700 text-sm line-height-3">ມີຄວາມປອດໄພ ແລະ ເກັບຮັກສາຂໍ້ມູນຢ່າງເປັນລະບົບ.</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AboutPage;