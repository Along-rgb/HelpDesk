/* eslint-disable @next/next/no-img-element */

import React, { useContext } from 'react';
import { LayoutContext } from './context/layoutcontext';
const AppFooter = () => {
    const { layoutConfig } = useContext(LayoutContext);

    return (
        <div className="layout-footer">
            <span className="font-medium ml-2 gradient-text "> EDL-HelpDesk & Asset Management System | ລະບົບບໍລິຫານຈັດການວຽກງານ ICT </span>
            <span className='layout-footer-font gradient-text '>V 1.3.1 </span>
        </div>
       
    );
};

export default AppFooter;
