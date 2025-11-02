import React from 'react';

const SourceTag = ({ source, fee }) => {
  const s = (source || '').trim();
  const isShopee = Number(fee) > 0 || /蝦皮/.test(s);
  
  if (isShopee) return <span className="tag tag-shopee">🛒 蝦皮</span>;
  if (/LINE/.test(s)) return <span className="tag tag-line">💬 LINE</span>;
  if (/門市|現場/.test(s)) return <span className="tag tag-store">🏪 門市</span>;
  return s ? <span className="tag">{s}</span> : null;
};

export default SourceTag;
