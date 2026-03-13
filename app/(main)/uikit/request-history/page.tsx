// ປະຫວັດການຮ້ອງຂໍ — ໜ້າ standalone ສຳລັບ Role 4 (User), ແຕ່ລະ tab ແບ່ງຕາມ id ສະຖານະຈາກ helpdeskstatus/selecthelpdeskstatus
'use client';

import React from 'react';
import { RequestHistoryContent } from './RequestHistoryContent';

export default function RequestHistoryPage() {
    return (
        <div className="p-4">
            <RequestHistoryContent showTitle />
        </div>
    );
}
