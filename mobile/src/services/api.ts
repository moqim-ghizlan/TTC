import axios from 'axios';

// Configure this URL to point to your backend
// For local development:
// - iOS Simulator: http://localhost:3000
// - Android Emulator: http://10.0.2.2:3000
// - Physical Device: http://YOUR_COMPUTER_IP:3000 (e.g., http://192.168.1.108:3000)
const API_BASE_URL = 'http://192.168.1.108:3000';

export interface CodeSnippet {
    key: string;
    content: string;
    updatedAt: string;
}

export const api = {
    // Validate or create a key
    async validateKey(key: string): Promise<{ valid: boolean; error?: string }> {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/key/validate`, { key });
            return response.data;
        } catch (error) {
            console.error('Validate key error:', error);
            return { valid: false, error: 'Failed to validate key' };
        }
    },

    // Generate a random key
    async generateKey(): Promise<{ key?: string; error?: string }> {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/key/generate`);
            return response.data;
        } catch (error) {
            console.error('Generate key error:', error);
            return { error: 'Failed to generate key' };
        }
    },

    // Get code snippet
    async getCode(key: string): Promise<CodeSnippet | null> {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/code/${key}`);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                // New snippet, not an error
                return null;
            }
            console.error('Get code error:', error);
            return null;
        }
    },

    // Update code snippet
    async updateCode(key: string, content: string): Promise<boolean> {
        try {
            await axios.put(`${API_BASE_URL}/api/code/${key}`, { content });
            return true;
        } catch (error) {
            console.error('Update code error:', error);
            return false;
        }
    },
};
