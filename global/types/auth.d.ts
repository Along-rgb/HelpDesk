// =========================================================
// 🟢 ส่วนที่ 1: Active Code (ใช้งานจริง)
// =========================================================

export type LoginInput = {
    username?: string;
    password?: string;
};

export type Login = {
    user: UserLogin;
    token: string;
};

export type UserLogin = {
    id: number;
    code: string;
    boardId: number;
    positionId: number;
    departmentId: number;
    divisionId: number;
    officeId: number | null;
    unitId: number;
    roleId: number;
    levelId: number;
};

export type User = {
    id: number;
    username: string;
    password: string;
    firstname: string;
    lastname: string;
    code: string;
    actived: boolean;
    genderId: number;
    tel: string;
    telapp: string;
    email: string;
    userimg: string | null;
    createdAt: string;
    updatedAt: string;
    // Relations
    gender: Gender;
    board: Board;
    position: Position;
    department: Department;
    division: Division;
    office: Office;
    unit: Unit;
    role: Role;
    level: Level;
};

// --- Master Data Types ---

export type Gender = { id: number; name: string; };
export type Board = { id: number; name: string; };
export type Position = { id: number; name: string; };
export type Department = { id: number; name: string; };
export type Division = { id: number; name: string; };
export type Office = { id: number; name: string; };
export type Unit = { id: number; name: string; };
export type Role = { id: number; name: string; };
export type Level = { id: number; name: string; };


// =========================================================
// 🟡 ส่วนที่ 2: Future Use / Templates (Comment เก็บไว้)
// (Uncomment เมื่อต้องการใช้งาน)
// =========================================================

/*
// --- 1. External Libraries Imports ---
// (เก็บไว้ตรงนี้เพื่อไม่ให้กระทบ code หลักหากยังไม่ได้ลง library)

import { EventApi, EventInput } from '@fullcalendar/core';
import { number } from 'prop-types'; // Note: ใน TS ปกติใช้ type 'number' ได้เลย ไม่ต้อง import ตัวนี้

// --- 2. Customer Service Template ---

export type Customer = {
    id?: number;
    name?: string;
    country?: any; // ต้องกำหนด Type ICountryObject หากนำมาใช้จริง
    company?: string;
    date: Date;
    status?: string;
    activity?: number;
    balance?: number | string;
    verified?: boolean;
    amount?: number;
    price?: number;
    rating?: number;
    image?: string;
    orders?: Customer[];
    inventoryStatus?: string;
    representative: {
        name: string;
        image: string;
    };
};
*/