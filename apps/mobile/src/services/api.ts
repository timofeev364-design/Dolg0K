import { Platform } from 'react-native';

// In dev, use localhost. In prod, this would be your deployed URL.
const API_URL = __DEV__
    ? (Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001')
    : 'https://dolg0k.onrender.com';

export type UserRegistration = {
    telegram_id?: string;
    username?: string;
    display_name: string;
};

export const api = {
    async register(data: UserRegistration) {
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        } catch (error) {
            console.error('API Register Error:', error);
            throw error;
        }
    },

    async getUsers() {
        try {
            const res = await fetch(`${API_URL}/admin/users`);
            return await res.json();
        } catch (error) {
            console.error('API GetUsers Error:', error);
            throw error;
        }
    }
};
