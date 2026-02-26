export interface WbBoxWarehouse {
    warehouseName: string;
    boxDeliveryAndStorageExpr: string;
    boxDeliveryBase: string;
    boxDeliveryLiter: string;
    boxStorageBase: string;
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
