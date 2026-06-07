import { getShopItemsService, purchaseItemService } from "../services/shop.service.js";

export const getShopItemsController = async (req, res) => {
    const user = req.user;
    try {
        const shopItems = await getShopItemsService(user);
    
        res.status(200).json(shopItems);
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json(error);
    }
}

export const purchaseItemController = async (req, res) => {
    const user = req.user;
    const { itemId } = req.params;
    try {
        const newStats = await purchaseItemService(user.id, itemId, user.timezone);
    
        res.status(200).json(newStats);
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json({message: error.message});
    }
}

// TODO: Clean up the error handling