import { apiClient } from "./axiosClient";
import { unwrapToArray } from "./normalize";

interface TableApiRecord {
	tableId?: string;
	uidTableId?: string;
	id?: string;
	tableCode?: string;
	tableName?: string;
	tableNo?: string | number;
	tableNumber?: string | number;
}

export interface TableOption {
	id: string;
	name: string;
	code: string;
}

export async function fetchTables(branchId: string): Promise<TableOption[]> {
	const res = await apiClient.get("/Table/GetTableList", { params: { branchId } });
	return unwrapToArray<TableApiRecord>(res.data)
		.map((record) => {
			const id = String(record.tableId ?? record.uidTableId ?? record.id ?? "");
			const code = String(record.tableCode ?? record.tableNo ?? record.tableNumber ?? "");
			const name = String(record.tableName ?? (code ? `Table ${code}` : code));
			return { id, name, code };
		})
		.filter((table) => table.id && table.name);
}
