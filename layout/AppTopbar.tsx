/* eslint-disable @next/next/no-img-element */
'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { AppTopbarRef } from '@/types';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

    return (
        <div className="layout-topbar">
            <h1  className="layout-topbar-logo">
                <img src={`/layout/images/faifarlao3.png`} width="47.22px" height={'35px'} alt="logo" />
                <span>EDL-HelpDesk | ການຈັດການບໍລິຫານວຽກງານ  ICT </span>
            </h1>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;