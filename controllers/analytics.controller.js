import { trackDonationClickService } from '../services/analytics.service.js';

// Tracks a donation click
export const donationClickController = async (req, res) => {
    try {
        await trackDonationClickService();
        res.status(200).json({ message: 'Donation click tracked successfully!' });
    } catch (error) {
        console.error("Failed to track donation click:", error);
        res.status(error.status || 500).json({ message: "Failed to track donation click", error: error.message });
    }
};
