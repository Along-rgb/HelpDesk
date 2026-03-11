"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { TabView, TabPanel } from "primereact/tabview";
import { useUserProfileStore } from "@/app/store/user/userProfileStore";
import RequestHistoryByStatus from "./RequestHistoryByStatus";

const PageUser = () => {
    const router = useRouter();
    const profileData = useUserProfileStore((s) => s.profileData);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    const displayName = profileData?.fullName || [profileData?.first_name, profileData?.last_name].filter(Boolean).join(" ").trim() || "—";
    const requestDate = new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="surface-ground px-4 py-5 md:px-6 lg:px-8">
            <div className="surface-card shadow-2 border-round bg-white overflow-hidden">
                <div className="grid list-none m-0">
                    {/* --- คอลัมน์ซ้าย: เนื้อหาหลัก (แบบ ticket-detail) --- */}
                    <div
                        className={`col-12 ${isSidebarVisible ? "md:col-9" : "md:col-12"} p-4 md:p-5 transition-all transition-duration-300`}
                    >
                        {/* แถบเครื่องมือบน */}
                        <div className="flex flex-column md:flex-row align-items-center justify-content-between mb-4">
                            <div className="flex align-items-center gap-2 w-full md:w-auto">
                                <Button
                                    icon="pi pi-arrow-left"
                                    outlined
                                    severity="secondary"
                                    className="border-1 border-300 text-700"
                                    onClick={() => router.back()}
                                />
                            </div>
                            <div className="flex align-items-center gap-2 mt-3 md:mt-0 w-full md:w-auto justify-content-end">
                                <Link href="/uikit/request-history" className="p-button p-button-outlined no-underline">
                                    <i className="pi pi-folder-open mr-2" />
                                    ປະຫວັດການຮ້ອງຂໍ
                                </Link>
                                <Button
                                    icon={isSidebarVisible ? "pi pi-chevron-right" : "pi pi-chevron-left"}
                                    outlined
                                    severity="secondary"
                                    className="border-1 border-300 text-700"
                                    onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                                    tooltip={isSidebarVisible ? "ປິດແຖບຂໍ້ມູນ" : "ສະແດງແຖບຂໍ້ມູນ"}
                                    tooltipOptions={{ position: "bottom" }}
                                />
                            </div>
                        </div>

                        {/* หัวข้อหลัก */}
                        <div className="mb-4">
                            <h2 className="m-0 text-900 font-bold text-3xl mb-2">ໜ້າຫຼັກຜູ້ໃຊ້</h2>
                            <span className="text-600 text-base">
                                ໂດຍ: [{profileData?.emp_code ?? ""}]-{displayName} | ເວລາ: {requestDate}
                            </span>
                        </div>

                        {/* แท็บ + พื้นที่เนื้อหา (แบบ ticket-detail) */}
                        <TabView className="p-0 custom-tabview text-lg">
                            <TabPanel header="ລາຍລະອຽດ" leftIcon="pi pi-list mr-2">
                                <div className="flex flex-column gap-3 mt-3 -mx-3 md:-mx-4">
                                    <Panel
                                        header="ລາຍລະອຽດ"
                                        toggleable
                                        className="border-top-1 border-yellow-500 shadow-none border-1 surface-border border-round-none"
                                    >
                                        <div className="m-0 text-700 line-height-3 text-base px-3 md:px-4">
                                            <p className="m-0 mb-3">
                                                ກະລຸນາເລືອກເມນູດ້ານເທິງ ເຊັ່ນ ປະຫວັດການຮ້ອງຂໍ ຫຼື ກ່ຽວກັບລະບົບ
                                            </p>
                                            <Link
                                                href="/uikit/request-history"
                                                className="p-button p-button-outlined no-underline"
                                            >
                                                <i className="pi pi-folder-open mr-2" />
                                                ປະຫວັດການຮ້ອງຂໍ
                                            </Link>
                                        </div>
                                    </Panel>

                                    <Panel
                                        header="ການສົນທະນາ"
                                        toggleable
                                        className="border-top-1 border-yellow-500 shadow-none border-1 surface-border border-round-none"
                                    >
                                        <div className="text-500 text-base italic py-4 px-3 md:px-4">
                                            ພື້ນທີ່ສໍາລັບການສະແດງລາຍການສົນທະນາ... (ກໍາລັງອັບເດດ)
                                        </div>
                                    </Panel>

                                    <Panel
                                        header="ກ່ຽວກັບລະບົບ"
                                        toggleable
                                        className="border-top-1 border-yellow-500 shadow-none border-1 surface-border border-round-none"
                                    >
                                        <div className="m-0 text-700 line-height-3 text-base px-3 md:px-4">
                                            <Link href="/uikit/Aboutsystem" className="no-underline text-primary">
                                                <i className="pi pi-info-circle mr-2" />
                                                ກ່ຽວກັບລະບົບ
                                            </Link>
                                        </div>
                                    </Panel>
                                </div>
                            </TabPanel>
                            <TabPanel header="ປະຫວັດການຮ້ອງຂໍ" leftIcon="pi pi-folder-open mr-2">
                                <div className="mt-3 -mx-3 md:-mx-4">
                                    <div className="flex justify-content-end mb-2">
                                        <Link href="/uikit/request-history" className="p-button p-button-outlined p-button-sm no-underline">
                                            ເປີດໜ້າປະຫວັດການຮ້ອງຂໍເຕັມ
                                        </Link>
                                    </div>
                                    <RequestHistoryByStatus />
                                </div>
                            </TabPanel>
                        </TabView>
                    </div>

                    {/* --- คอลัมน์ขวา: แถบข้อมูล (แบบ ticket-detail — ພາກສ່ວນຮ້ອງຂໍ) --- */}
                    {isSidebarVisible && (
                        <div className="col-12 md:col-3 p-4 md:p-4 surface-border md:border-left-1 surface-50 md:surface-0 fadein animation-duration-300">
                            <div className="mb-4">
                                <div className="text-blue-600 font-bold text-2xl mb-3 border-bottom-1 surface-border pb-2">
                                    ພາກສ່ວນຜູ້ໃຊ້
                                </div>
                                <ul className="list-none p-0 m-0 text-base">
                                    <li className="flex align-items-center gap-2 py-3 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ສະຖານະ</span>
                                        <span className="text-700 flex-1 min-w-0">
                                            {profileData?.status || "—"}
                                        </span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-3 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ວັນທີ</span>
                                        <span className="text-700 flex-1 min-w-0">{requestDate}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-3 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ຜູ້ໃຊ້</span>
                                        <span className="text-700 flex-1 min-w-0">
                                            [{profileData?.emp_code ?? ""}]-{displayName}
                                        </span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-3 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ຝ່າຍ</span>
                                        <span className="text-700 flex-1 min-w-0">
                                            {profileData?.department_name || "—"}
                                        </span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-3 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ພະແນກ</span>
                                        <span className="text-700 flex-1 min-w-0">
                                            {profileData?.division_name || "—"}
                                        </span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-3 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ໜ່ວຍງານ</span>
                                        <span className="text-700 flex-1 min-w-0">
                                            {profileData?.unit_name || "—"}
                                        </span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-3 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ຕໍ່າແອງ</span>
                                        <span className="text-700 flex-1 min-w-0">
                                            {profileData?.pos_name || "—"}
                                        </span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-3">
                                        <span className="text-900 font-bold flex-shrink-0">ເບີໂທ</span>
                                        <span className="text-700 flex-1 min-w-0">
                                            {profileData?.tel || "—"}
                                        </span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-3 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ອີເມວ</span>
                                        <span
                                            className="text-700 flex-1 min-w-0"
                                            style={{ wordBreak: "break-all" }}
                                        >
                                            {profileData?.email || "—"}
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PageUser;
