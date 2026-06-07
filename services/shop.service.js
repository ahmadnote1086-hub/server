import { fetchShopItems, purchaseItemModel } from "../models/shop.model.js"
import { fetchUserStats } from "../models/user.model.js";
import { throwErr } from "../utils/error.utils.js";


export const getShopItemsService = async () => {
    const shopItems = await fetchShopItems();

    if (!shopItems) throwErr("Items not found", 404);

    return shopItems;
}

export const purchaseItemService = async (userId, itemId, timezone) => {
    const userStats = await fetchUserStats(userId)
    if (!userStats) return throwErr("Stats not found", 404);
    
    const newStats = await purchaseItemModel(itemId, userStats, timezone);

    return newStats;
}