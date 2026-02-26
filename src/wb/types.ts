export interface WbBoxWarehouse {
    warehouseName: string;
    geoName?: string;
    boxDeliveryAndStorageExpr: string;
    boxDeliveryBase: string;
    boxDeliveryLiter: string;
    boxDeliveryMarketplaceBase?: string;
    boxDeliveryMarketplaceCoefExpr?: string;
    boxDeliveryMarketplaceLiter?: string;
    boxStorageBase: string;
    boxStorageCoefExpr?: string;
    boxStorageLiter: string;
}

export interface WbTariffsBoxResponse {
    response: {
        data: {
            dtNextBox: string;
            dtTillMax: string;
            warehouseList: WbBoxWarehouse[];
        };
    };
}
