import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeBankBranchPayload,
  normalizeBankPayload,
  resolveEmployeeBankSelection
} from "../src/models/bankModel.js";

test("bank payload keeps active status and trims its code and name", () => {
  assert.deepEqual(
    normalizeBankPayload({ code: " BOP ", bank: " Bank of Punjab ", isActive: false }),
    { code: "BOP", bank: "Bank of Punjab", isActive: 0 }
  );
});

test("branch payload requires a numeric parent bank id and supports inactive branches", () => {
  assert.deepEqual(
    normalizeBankBranchPayload({ bankId: "12", code: " 001 ", branch: " Main Branch ", isActive: "0" }),
    { bankId: 12, code: "001", branch: "Main Branch", isActive: 0 }
  );
});

test("employee bank data is optional but cannot be partially entered", async () => {
  assert.equal((await resolveEmployeeBankSelection({})).message, "");
  assert.equal(
    (await resolveEmployeeBankSelection({ bankCode: "BOP", accountNo: "123" })).message,
    "Bank, branch, and account number are required together."
  );
});
