"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel"; 
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { TabView, TabPanel } from "primereact/tabview";
import { Ticket } from "../../table/types"; 
import { ticketService } from "../../../../services/ticketService"; 
import { STATUS_MAP } from "../../table/constants"; 

export default function TicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    
    // State สำหรับ Dropdown รายชื่อช่าง
    const [technicians, setTechnicians] = useState([]); 
    const [selectedAssignee, setSelectedAssignee] = useState(null);

    useEffect(() => {
        const id = params.id;
        if (id) {
            setLoading(true);
            ticketService.getTickets().then((data) => {
             const foundTicket = (data as Ticket[]).find(t => t.id.toString() === id.toString());
                setTicket(foundTicket || null);
                setLoading(false);
            });
        }
        // ticketService.getTechnicians().then(data => setTechnicians(data));
    }, [params.id]);

    if (loading) return <div className="p-4">ກໍາລັງໂຫຼດຂໍ້ມູນ...</div>;
    if (!ticket) return <div className="p-4">ບໍ່ພົບຂໍ້ມູນ Ticket ID: {params.id}</div>;

    const requesterName = ticket.requester || `${ticket.firstname_req || ''} ${ticket.lastname_req || ''}`.trim();

    return (
        <div className="surface-ground px-4 py-5 md:px-6 lg:px-8">
            <div className="grid">
                
                {/* --- LEFT COLUMN --- */}
                <div className="col-12 md:col-9">
                    <div className="surface-card shadow-2 border-round p-4 bg-white h-full">
                        
                        {/* 1. TOP TOOLBAR */}
                        <div className="flex flex-column md:flex-row align-items-center justify-content-between mb-4">
                            <div className="flex align-items-center gap-2 w-full md:w-auto">
                                <Button 
                                    icon="pi pi-arrow-left" 
                                    outlined 
                                    severity="secondary"
                                    className="border-1 border-300 text-700"
                                    onClick={() => router.back()} 
                                />
                                
                                <Dropdown 
                                    value={selectedAssignee} 
                                    onChange={(e) => setSelectedAssignee(e.value)} 
                                    options={technicians} 
                                    optionLabel="name" 
                                    placeholder="ມອບໝາຍວຽກ" 
                                    className="w-16rem"
                                    emptyMessage="ບໍ່ພົບລາຍຊື່"
                                    pt={{
                                        root: { className: 'border-1 border-300' }
                                    }}
                                />

                                <Button 
                                    label="ຮັບວຽກເອງ" 
                                    icon="pi pi-check" 
                                    className="surface-700 border-none text-white hover:surface-800"
                                />
                            </div>

                            <div className="flex align-items-center gap-2 mt-3 md:mt-0 w-full md:w-auto justify-content-end">
                                <Button 
                                    label="ຕອບກັບ" 
                                    icon="pi pi-reply" 
                                    severity="success" 
                                    className="bg-green-500 border-green-500 hover:bg-green-600"
                                />
                                
                                <Button 
                                    icon="pi pi-chevron-right" 
                                    outlined 
                                    severity="secondary"
                                    className="border-1 border-300 text-700" 
                                />
                            </div>
                        </div>

                        {/* 2. HEADER TITLE */}
                        <div className="mb-4">
                            <h2 className="m-0 text-900 font-bold text-2xl mb-2">#{ticket.id} {ticket.title}</h2>
                            <span className="text-600 text-sm">
                               ໂດຍ: [{ticket.employeeId}]-{requesterName} | ເວລາ: {ticket.date}
                            </span>
                        </div>

                        {/* 3. TABS & PANELS */}
                        <TabView className="p-0 custom-tabview">
                            <TabPanel header="ລາຍລະອຽດ" leftIcon="pi pi-list mr-2">
                                <div className="flex flex-column gap-3 mt-3">
                                    
                                    <Panel header="ລາຍລະອຽດ" toggleable className="border-top-1 border-yellow-500 shadow-none border-1 surface-border">
                                        <div className="m-0 text-700 line-height-3">
                                            {ticket.description ? (
                                                <div dangerouslySetInnerHTML={{ __html: ticket.description }} />
                                            ) : (
                                                <div className="text-500">ບໍ່ມີລາຍລະອຽດເພີ່ມເຕີມ</div>
                                            )}
                                        </div>
                                    </Panel>

                                    <Panel header="ການສົນທະນາ" toggleable className="border-top-1 border-yellow-500 shadow-none border-1 surface-border">
                                        <div className="text-500 text-sm italic py-4">
                                            ພື້ນທີ່ສໍາລັບການສະແດງລາຍການສົນທະນາລະຫວ່າງທີມຊ່ວຍເຫຼືອ ແລະ ຜູ້ຮ້ອງຂໍ (ກໍາລັງອັບເດດ)
                                        </div>
                                    </Panel>

                                    <Panel header="ຂໍ້ມູນອຸປະກອນ ແລະ ລາຍລະອຽດເພີ່ມເຕີມ" toggleable className="border-top-1 border-yellow-500 shadow-none border-1 surface-border">
                                        <div className="text-500 text-sm italic py-4">
                                            ພື້ນທີ່ສໍາລັບສະແດງຂໍ້ມູນລາຍລະອຽດຂອງອຸປະກອນ (ກໍາລັງອັບເດດ)
                                        </div>
                                    </Panel>
                                </div>
                            </TabPanel>
                            
                            <TabPanel header="ປະຫວັດ" leftIcon="pi pi-history mr-2">
                                <div className="p-3 border-1 surface-border border-round mt-3">
                                    <p>ປະຫວັດການດໍາເນີນງານ...</p>
                                </div>
                            </TabPanel>
                        </TabView>

                    </div>
                </div>

                {/* --- RIGHT COLUMN: Sidebar --- */}
                <div className="col-12 md:col-3"> 
                    
                    {/* Card 1: Requester Info */}
                    <div className="surface-card p-4 shadow-2 border-round mb-4 bg-white">
                        <div className="text-blue-600 font-bold text-xl mb-3 border-bottom-1 surface-border pb-2">
                            ພາກສ່ວນຮ້ອງຂໍ
                        </div>
                        
                        <ul className="list-none p-0 m-0">
                            <li className="flex align-items-center py-3 border-bottom-1 surface-border">
                                <span className="text-900 font-medium w-6rem">ສະຖານະ:</span>
                                <div className="flex-1">
                                    <Tag 
                                        icon="pi pi-clock" 
                                        value={ticket.status} 
                                        severity={STATUS_MAP[ticket.status] as any} 
                                        className="text-sm px-2 py-1"
                                    />
                                </div>
                            </li>
                            <li className="flex align-items-start py-3 border-bottom-1 surface-border">
                                <span className="text-900 font-medium w-6rem">ວັນທີຮ້ອງຂໍ:</span>
                                <span className="text-700 flex-1">{ticket.date}</span>
                            </li>
                            <li className="flex align-items-start py-3 border-bottom-1 surface-border">
                                <span className="text-900 font-medium w-6rem">ຜູ້ຮ້ອງຂໍ:</span>
                                <span className="text-700 flex-1">[{ticket.id}]-{requesterName}</span>
                            </li>
                            <li className="flex align-items-start py-3 border-bottom-1 surface-border">
                                <span className="text-900 font-medium w-6rem">ຝ່າຍ:</span>
                                <span className="text-700 flex-1">{ticket.department || '-'}</span>
                            </li>
                            <li className="flex align-items-start py-3 border-bottom-1 surface-border">
                                <span className="text-900 font-medium w-6rem">ພະແນກ:</span>
                                <span className="text-700 flex-1">{ticket.division || '-'}</span>
                            </li>
                            <li className="flex align-items-start py-3 border-bottom-1 surface-border">
                                <span className="text-900 font-medium w-6rem">ສະຖານທີ່:</span>
                                <span className="text-700 flex-1">
                                    {ticket.building || 'ຕຶກສໍານັກງານໃຫຍ່'}
                                </span>
                            </li>
                             <li className="flex align-items-start py-3 border-bottom-1 surface-border">
                                <span className="text-900 font-medium w-6rem">ຊັ້ນ:</span>
                                <span className="text-700 flex-1">{ticket.level || 'ຊັ້ນ-05'}</span>
                            </li>
                            <li className="flex align-items-start py-3 border-bottom-1 surface-border">
                                <span className="text-900 font-medium w-6rem">ຫ້ອງ:</span>
                                <span className="text-700 font-bold flex-1">{ticket.room || '502'}</span>
                            </li>
                            <li className="flex align-items-start py-3 border-bottom-1 surface-border">
                                <span className="text-900 font-medium w-6rem">ເບີໂທ:</span>
                                <span className="text-700 flex-1">{ticket.contactPhone || '020 9999 9999'}</span>
                            </li>
                            <li className="flex align-items-start py-3">
                                <span className="text-900 font-medium w-6rem">ອີເມວ:</span>
                                <span className="text-700 flex-1" style={{wordBreak: 'break-all'}}>
                                    {ticket.email || 'viengkhongkc@gmail.com'}
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Card 2: Repair Units */}
                    <div className="surface-card shadow-2 border-round bg-white p-3">
                        
                        {/* Panel 1: Internal */}
                        <Panel header="ໜ່ວຍງານສ້ອມແປງພາຍໃນ" toggleable className="mb-3 shadow-none border-1 surface-border">
                            <div className="m-0">
                                <div className="text-700 font-bold mb-3">ວິຊາການກວດກາ:</div>
                                <ul className="list-none p-0 m-0">
                                    {ticket.assignees && ticket.assignees.length > 0 ? (
                                        ticket.assignees.map((assignee: any, index: number) => (
                                            <li key={index} className="flex align-items-center py-1 gap-2 mb-1">
                                                <i className="pi pi-chevron-right text-xs text-500"></i>
                                                <div className="flex flex-column">
                                                    <span className="text-700 text-sm">
                                                        {assignee.name} {assignee.phone ? `| ${assignee.phone}` : ''}
                                                    </span>
                                                </div>
                                            </li>
                                        ))
                                    ) : (
                                        <div className="text-500 italic text-sm">ຍັງບໍ່ມີຜູ້ຮັບຜິດຊອບ</div>
                                    )}
                                </ul>

                                <div className="text-700 font-bold mt-4 mb-2">ລາຍລະອຽດການກວດກາ ແລະ ສ້ອມແປງ:</div>
                                <div className="text-500 text-sm pl-3 border-left-2 border-300">
                                    -
                                </div>
                            </div>
                        </Panel>

                        {/* Panel 2: External (REMOVED DIVIDERS) */}
                        <Panel header="ຮ້ານແປງນອກ" toggleable className="shadow-none border-1 surface-border">
                            <ul className="list-none p-0 m-0">
                                {/* ລົບ border-bottom-1 surface-border ອອກທັງໝົດ */}
                                <li className="flex align-items-center justify-content-between py-2">
                                    <span className="text-700 font-bold">ຮ້ານທີ່ສັ່ງແປງ:</span>
                                    <span className="text-900 ml-2">-</span>
                                </li>
                                <li className="flex align-items-center justify-content-between py-2">
                                    <span className="text-700 font-bold">ເລກທີໃບນຳສົ່ງ:</span>
                                    <span className="text-900 ml-2">-</span>
                                </li>
                                <li className="flex align-items-center justify-content-between py-2">
                                    <span className="text-700 font-bold">ວັນທີສັ່ງ:</span>
                                    <span className="text-900 ml-2">-</span>
                                </li>
                                <li className="flex align-items-center justify-content-between py-2">
                                    <span className="text-700 font-bold">ສະຖານະ:</span>
                                    <span className="text-900 ml-2">-</span>
                                </li>
                            </ul>
                        </Panel>

                    </div>
                </div>
            </div>
        </div>
    );
}