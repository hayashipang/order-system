import React from 'react';

export default function NewCustomerForm({
  error,
  success,
  handleAddCustomer,
  newCustomer,
  setNewCustomer,
  loading
}) {
  return (
    <div className="card">
      <h2>新增客戶</h2>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleAddCustomer}>
        <div className="form-group">
          <label className="form-label">客戶姓名</label>
          <input
            type="text"
            className="form-input"
            value={newCustomer.name}
            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
            placeholder="輸入客戶姓名"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">電話</label>
          <input
            type="text"
            className="form-input"
            value={newCustomer.phone}
            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            placeholder="輸入電話（可選）"
          />
        </div>

        <div className="form-group">
          <label className="form-label">地址</label>
          <input
            type="text"
            className="form-input"
            value={newCustomer.address}
            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
            placeholder="輸入地址（可選）"
          />
        </div>

        <div className="form-group">
          <label className="form-label">備註</label>
          <textarea
            className="form-textarea"
            value={newCustomer.notes}
            onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
            placeholder="備註（可選）"
          />
        </div>

        <button type="submit" className="button success" disabled={loading}>
          {loading ? '新增中...' : '新增客戶'}
        </button>
      </form>
    </div>
  );
}

