import { formatInstruction, type PresItem } from '@/features/medical-records/lib/exam';

interface Props {
  patientName: string;
  patientPhone: string;
  doctorName: string;
  diagnosis?: string;
  data: { note?: string | null; items: PresItem[] };
}

export function PrescriptionPrint({ patientName, patientPhone, doctorName, diagnosis, data }: Props) {
  const now = new Date();
  return (
    <div className="print-only print-container">
      <div className="print-header">
        <div style={{ fontSize: '11px', fontWeight: 'bold' }}>HỆ THỐNG PHÒNG KHÁM DA LIỄU VIETSKIN</div>
        <div style={{ fontSize: '8px', color: '#333' }}>Địa chỉ: 123 Đường ABC, Quận 1, TP. HCM - Hotline: 1900 6060</div>
        <div className="print-title">ĐƠN THUỐC</div>
      </div>

      <div className="print-info-grid">
        <div><strong>Họ tên BN:</strong> {patientName}</div>
        <div><strong>Điện thoại:</strong> {patientPhone}</div>
        <div><strong>Bác sĩ kê:</strong> {doctorName || '—'}</div>
        <div><strong>Ngày kê đơn:</strong> {now.toLocaleDateString('vi-VN')}</div>
      </div>

      {diagnosis && (
        <div style={{ marginBottom: '8px', fontSize: '9px' }}>
          <strong>Chẩn đoán:</strong> {diagnosis}
        </div>
      )}

      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: '6%', textAlign: 'center' }}>STT</th>
            <th style={{ width: '44%' }}>Tên thuốc</th>
            <th style={{ width: '12%', textAlign: 'center' }}>SL</th>
            <th style={{ width: '38%' }}>Cách dùng chỉ dẫn</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it, i) => (
            <tr key={i}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>
                <strong style={{ fontSize: '9px' }}>{it.medicineName}</strong>
                {it.note && <div style={{ fontSize: '8px', color: '#555', fontStyle: 'italic', marginTop: '1px' }}>* Lưu ý: {it.note}</div>}
              </td>
              <td style={{ textAlign: 'center' }}>{it.quantity || '—'}</td>
              <td>{formatInstruction(it.dosage, it.frequency, it.duration)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.note && (
        <div style={{ fontSize: '9px', marginBottom: '8px', borderTop: '1px dashed #ccc', paddingTop: '4px' }}>
          <strong>Lời dặn của bác sĩ:</strong> {data.note}
        </div>
      )}

      <div className="print-footer">
        <div style={{ fontSize: '7.5px', color: '#444', maxWidth: '200px' }}>
          <div>* Đơn thuốc có giá trị mua trong vòng 05 ngày.</div>
          <div>* Quý khách vui lòng mang theo đơn khi tái khám.</div>
        </div>
        <div className="print-signatures">
          <div>Ngày {now.getDate()} tháng {now.getMonth() + 1} năm {now.getFullYear()}</div>
          <div style={{ fontWeight: 'bold', marginTop: '2px', fontSize: '9px' }}>Bác sĩ điều trị</div>
          <div style={{ height: '40px' }} />
          <div style={{ fontWeight: 'bold', fontSize: '9.5px' }}>{doctorName || '—'}</div>
        </div>
      </div>

      <style>{`
        @media screen { .print-only { display: none !important; } }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          @page { size: A6 portrait; margin: 5mm; }
          body { margin: 0; padding: 0; font-size: 10px; line-height: 1.3; color: #000; background: #fff; font-family: 'Helvetica Neue', Arial, sans-serif; }
          .print-container { width: 100%; box-sizing: border-box; padding: 2px; }
          .print-header { text-align: center; margin-bottom: 8px; border-bottom: 2px solid #000; padding-bottom: 6px; }
          .print-title { font-size: 14px; font-weight: bold; text-transform: uppercase; margin: 6px 0 2px 0; letter-spacing: 1px; }
          .print-info-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 4px; margin-bottom: 6px; font-size: 9px; }
          .print-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          .print-table th, .print-table td { border: 1px solid #000; padding: 4px 6px; text-align: left; font-size: 8.5px; line-height: 1.2; }
          .print-table th { background-color: #f0f0f0; font-weight: bold; }
          .print-footer { margin-top: 15px; display: flex; justify-content: space-between; align-items: flex-end; }
          .print-signatures { text-align: center; width: 140px; font-size: 8px; }
        }
      `}</style>
    </div>
  );
}
