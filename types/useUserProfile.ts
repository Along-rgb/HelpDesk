import React from 'react'; // อย่าลืม import React ถ้ามีการใช้ useState/useEffect

// ⭐ เติม export ตรงนี้ เพื่อให้ไฟล์อื่นเรียกใช้ได้
export const useUserProfile = () => {
    const [displayName, setDisplayName] = React.useState("User");

    React.useEffect(() => {
        try {
            const storedData = localStorage.getItem('userData');
            if (storedData) {
                const user = JSON.parse(storedData);
                const fullName = `${user.firstname || ''} ${user.name || user.lastname || ''}`;
                if (fullName.trim()) setDisplayName(fullName);
            }
        } catch (error) {
            console.error("Failed to load user profile:", error);
        }
    }, []);

    return { displayName };
};