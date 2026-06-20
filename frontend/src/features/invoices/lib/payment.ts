export const CLINIC_BANK = {
  bankCode: 'MB',
  accountNo: '0123456789',
  accountName: 'PHONG KHAM DA LIEU VIETSKIN',
};

export type PayMethod = 'cash' | 'bank_transfer' | 'qr_code';

export function buildVietQR(amount: number, addInfo: string) {
  const base = `https://img.vietqr.io/image/${CLINIC_BANK.bankCode}-${CLINIC_BANK.accountNo}-compact2.png`;
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo,
    accountName: CLINIC_BANK.accountName,
  });
  return `${base}?${params}`;
}
