/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import React, { forwardRef, useContext, useImperativeHandle, useRef } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { onMenuToggle } = useContext(LayoutContext);
    
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

            <div className="layout-topbar-actions">   

                {/* <Link href="/documentation">
                    <button type="button" className="p-link topbar-action-btn">
                        <i className="pi pi-cog"></i>
                
                    </button>
                </Link> */}

                <button 
                    ref={menubuttonRef} 
                    type="button" 
                    className="p-link topbar-action-btn hamburger-btn" 
                    onClick={onMenuToggle}
                >
                    <i className="pi pi-bars" style={{ fontSize: '1.5rem' }} />
                </button>
                
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;