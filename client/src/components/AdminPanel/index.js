// index.js（整潔版）段落 1 / 6：Imports

import React from "react";

import NewOrderForm from "./views/NewOrderForm";

import NewCustomerForm from "./views/NewCustomerForm";

import EditOrderForm from "./views/EditOrderForm";

import CustomerManagement from "./views/CustomerManagement";

import OrderHistory from "./views/OrderHistory";

import ShippingManagement from "./views/ShippingManagement";

import InventoryManagement from "./views/InventoryManagement";

import { useAdminPanel } from "./hooks/useAdminPanel";


// index.js（整潔版）段落 2 / 6：Component & Hook 初始化

export default function AdminPanel({ user }) {

  const hookData = useAdminPanel(user);


  const {

    activeTab,

    setActiveTab,

    customers,

    setCustomers,

    products,

    setProducts,

    loading,

    setLoading,

    error,

    setError,

    success,

    setSuccess,

    newOrder,

    setNewOrder,

    shippingFee,

    setShippingFee,

    newCustomer,

    setNewCustomer,

    orderHistory,

    setOrderHistory,

    orderHistoryLoaded,

    historyFilters,

    setHistoryFilters,

    historyCustomerSearchTerm,

    setHistoryCustomerSearchTerm,

    filteredHistoryCustomers,

    setFilteredHistoryCustomers,

    shippingOrders,

    setShippingOrders,

    shippingDate,

    setShippingDate,

    weeklyShippingData,

    setWeeklyShippingData,

    showWeeklyOverview,

    setShowWeeklyOverview,

    customerSearchTerm,

    setCustomerSearchTerm,

    customerSourceFilter,

    setCustomerSourceFilter,

    filteredCustomers,

    setFilteredCustomers,

    inventoryData,

    setInventoryData,

    inventoryTransactions,

    setInventoryTransactions,

    inventoryForm,

    setInventoryForm,

    editingCustomer,

    setEditingCustomer,

    editCustomerForm,

    setEditCustomerForm,

    editingOrder,

    setEditingOrder,

    editOrderForm,

    setEditOrderForm,

    downloadOptions,

    setDownloadOptions,

    uploadOptions,

    setUploadOptions,

    idMappings,

    setIdMappings,

    fetchShippingFee,

    fetchShippingOrders,

    handleUpdateShippingStatus,

    fetchWeeklyShippingData,

    fetchCustomers,

    handleCustomerSearch,

    handleSourceFilter,

    handleHistoryCustomerSearch,

    fetchProducts,

    fetchInventoryData,

    fetchInventoryTransactions,

    handleInventoryTransaction,

    handleDeleteInventoryTransaction,

    handleResetInventoryTransactions,

    handleResetAllStock,

    startEditCustomer,

    cancelEditCustomer,

    handleUpdateCustomer,

    handleDeleteCustomer,

    fetchOrderHistory,

    handleAddOrder,

    handleAddCustomer,

    handleEditOrder,

    handleUpdateOrder,

    handleDeleteOrder,

    updateEditOrderItem,

    addEditOrderItem,

    removeEditOrderItem,

    addOrderItem,

    addGiftItem,

    removeOrderItem,

    updateOrderItem,

    calculateTotalAmount,

    calculateCreditCardFee,

    calculateShopeeFee,

    calculateEditCreditCardFee,

    calculateEditShopeeFee,

    handleSeparateDownload,

    handleBatchDownload,

    handleSeparateUpload,

    handleBatchUpload,

    exportToCSV,

    deleteOrderHistory,

  } = hookData;


// index.js（整潔版）段落 3 / 6：Nav 按鈕區（UI 保持不變）

  return (

    <div>

      <div className="card">

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>

          {user?.role === "admin" && (

            <>

              <button

                className={`nav-button ${activeTab === "new-order" ? "active" : ""}`}

                onClick={() => setActiveTab("new-order")}

                style={{

                  backgroundColor: activeTab === "new-order" ? "#27ae60" : "#2ecc71",

                  color: "white",

                  display: "flex",

                  alignItems: "center",

                  gap: "8px",

                }}

              >

                ➕ 新增訂單

              </button>

      <button

                className={`nav-button ${activeTab === "customers" ? "active" : ""}`}

                onClick={() => setActiveTab("customers")}

                style={{

                  backgroundColor: activeTab === "customers" ? "#3498db" : "#5dade2",

                  color: "white",

                  display: "flex",

                  alignItems: "center",

                  gap: "8px",

                }}

              >

                ➕ 客戶管理

              </button>

      <button

                className={`nav-button ${activeTab === "order-history" ? "active" : ""}`}

                onClick={() => setActiveTab("order-history")}

                style={{

                  backgroundColor: activeTab === "order-history" ? "#9b59b6" : "#bb8fce",

                  color: "white",

                  display: "flex",

                  alignItems: "center",

                  gap: "8px",

                }}

              >

                📋 訂單歷史

              </button>

            </>

          )}


          <button

            className={`nav-button ${activeTab === "inventory-management" ? "active" : ""}`}

            onClick={() => setActiveTab("inventory-management")}

            style={{

              backgroundColor: activeTab === "inventory-management" ? "#8e44ad" : "#a569bd",

              color: "white",

              display: "flex",

              alignItems: "center",

              gap: "8px",

            }}

          >

            📦 庫存管理

          </button>

      <button

            className={`nav-button ${activeTab === "shipping-management" ? "active" : ""}`}

            onClick={() => setActiveTab("shipping-management")}

            style={{

              backgroundColor: activeTab === "shipping-management" ? "#e67e22" : "#f39c12",

              color: "white",

              display: "flex",

              alignItems: "center",

              gap: "8px",

            }}

          >

            {user?.role === "kitchen" ? "🚚 廚房出貨訂單" : "🚚 出貨管理"}

          </button>


          {editingOrder && (

            <button

              className={`nav-button ${activeTab === "edit-order" ? "active" : ""}`}

              onClick={() => setActiveTab("edit-order")}

              style={{

                backgroundColor: activeTab === "edit-order" ? "#e67e22" : "#f39c12",

                color: "white",

                display: "flex",

                alignItems: "center",

                gap: "8px",

              }}

            >

              ✏️ 編輯訂單

            </button>

          )}

        </div>

      </div>


// index.js（整潔版）段落 4 / 6：Views – New / Customer / Edit

      {activeTab === "new-order" && (

        <NewOrderForm

          error={error}

          success={success}

          handleAddOrder={handleAddOrder}

          newOrder={newOrder}

          setNewOrder={setNewOrder}

          customers={customers}

          setActiveTab={setActiveTab}

          products={products}

          updateOrderItem={updateOrderItem}

          removeOrderItem={removeOrderItem}

          addOrderItem={addOrderItem}

          addGiftItem={addGiftItem}

          shippingFee={shippingFee}

          calculateTotalAmount={calculateTotalAmount}

          calculateCreditCardFee={calculateCreditCardFee}

          calculateShopeeFee={calculateShopeeFee}

          loading={loading}

        />

      )}


      {activeTab === "new-customer" && (

        <NewCustomerForm

          error={error}

          success={success}

          handleAddCustomer={handleAddCustomer}

          newCustomer={newCustomer}

          setNewCustomer={setNewCustomer}

          loading={loading}

        />

      )}


      {activeTab === "edit-order" && (

        <EditOrderForm

          error={error}

          success={success}

          handleUpdateOrder={handleUpdateOrder}

          editingOrder={editOrderForm}

          setEditingOrder={setEditOrderForm}

          customers={customers}

          products={products}

          updateEditingOrderItem={updateEditOrderItem}

          removeEditingOrderItem={removeEditOrderItem}

          loading={loading}

        />

      )}


// index.js（整潔版）段落 5 / 6：Views – Customers / History

      {activeTab === "customers" && (

        <CustomerManagement

          error={error}

          success={success}

          setActiveTab={setActiveTab}

          downloadOptions={downloadOptions}

          setDownloadOptions={setDownloadOptions}

          handleBatchDownload={handleBatchDownload}

          handleSeparateDownload={handleSeparateDownload}

          loading={loading}

          uploadOptions={uploadOptions}

          setUploadOptions={setUploadOptions}

          handleBatchUpload={handleBatchUpload}

          handleSeparateUpload={handleSeparateUpload}

          editingCustomer={editingCustomer}

          editCustomerForm={editCustomerForm}

          setEditCustomerForm={setEditCustomerForm}

          handleUpdateCustomer={handleUpdateCustomer}

          cancelEditCustomer={cancelEditCustomer}

          customerSearchTerm={customerSearchTerm}

          handleCustomerSearch={handleCustomerSearch}

          customerSourceFilter={customerSourceFilter}

          handleSourceFilter={handleSourceFilter}

          filteredCustomers={filteredCustomers}

          newOrder={newOrder}

          setNewOrder={setNewOrder}

          startEditCustomer={startEditCustomer}

          handleDeleteCustomer={handleDeleteCustomer}

        />

      )}


      {activeTab === "order-history" && (

        <OrderHistory

          historyCustomerSearchTerm={historyCustomerSearchTerm}

          handleHistoryCustomerSearch={handleHistoryCustomerSearch}

          filteredHistoryCustomers={filteredHistoryCustomers}

          historyFilters={historyFilters}

          setHistoryFilters={setHistoryFilters}

          fetchOrderHistory={fetchOrderHistory}

          loading={loading}

          customers={customers}

          setHistoryCustomerSearchTerm={setHistoryCustomerSearchTerm}

          setFilteredHistoryCustomers={setFilteredHistoryCustomers}

          setOrderHistory={setOrderHistory}

          exportToCSV={exportToCSV}

          deleteOrderHistory={deleteOrderHistory}

          orderHistory={orderHistory}

          handleEditOrder={handleEditOrder}

          handleDeleteOrder={handleDeleteOrder}

        />

      )}


// index.js（整潔版）段落 6 / 6：Views – Shipping / Inventory & 結尾

      {activeTab === "shipping-management" && (

        <ShippingManagement

          user={user}

          showWeeklyOverview={showWeeklyOverview}

          setShowWeeklyOverview={setShowWeeklyOverview}

          shippingDate={shippingDate}

          setShippingDate={setShippingDate}

          weeklyShippingData={weeklyShippingData}

          shippingOrders={shippingOrders}

          inventoryData={inventoryData}

          handleUpdateShippingStatus={handleUpdateShippingStatus}

        />

      )}


      {activeTab === "inventory-management" && (

        <InventoryManagement

          error={error}

          success={success}

          handleInventoryTransaction={handleInventoryTransaction}

          inventoryForm={inventoryForm}

          setInventoryForm={setInventoryForm}

          products={products}

          loading={loading}

          handleResetAllStock={handleResetAllStock}

          inventoryData={inventoryData}

          handleResetInventoryTransactions={handleResetInventoryTransactions}

          handleDeleteInventoryTransaction={handleDeleteInventoryTransaction}

          inventoryTransactions={inventoryTransactions}

        />

      )}

    </div>

  );

}
