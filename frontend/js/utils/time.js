// =======================
// 相对时间
// =======================

export function timeAgo(dateString) {

  const date = new Date(dateString);
  const now = new Date();

  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) {
    return "刚刚";
  }

  if (diff < 3600) {
    return Math.floor(diff / 60) + "分钟前";
  }

  if (diff < 86400) {
    return Math.floor(diff / 3600) + "小时前";
  }

  if (diff < 2592000) {
    return Math.floor(diff / 86400) + "天前";
  }

  if (diff < 31536000) {
    return Math.floor(diff / 2592000) + "个月前";
  }

  return Math.floor(diff / 31536000) + "年前";
}


// =======================
// 农历日期
// =======================

export function formatTraditionalDate(dateString) {

  if (!dateString) return "";

  const date = new Date(dateString);

  const lunar = Lunar.fromDate(new Date(dateString));


  return `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
}


// =======================
// 四季称呼
// =======================

export function getSeasonName(dateString) {

  const month = new Date(dateString).getMonth() + 1;

  if (month == 3 ) {
    return "孟春";
  }
  
  if (month == 4 ) {
    return "仲春";
  }
  
  if (month == 5 ) {
    return "季春";
  }

   if (month == 6 ) {
    return "孟夏";
  }
  
  if (month == 7 ) {
    return "仲夏";
  }
  
  if (month == 8 ) {
    return "季夏";
  }

   if (month == 9 ) {
    return "孟秋";
  }
  
  if (month == 10 ) {
    return "仲秋";
  }
  
  if (month == 11 ) {
    return "季秋";
  }

   if (month == 12 ) {
    return "孟冬";
  }
  
  if (month == 1 ) {
    return "仲冬";
  }
  
  if (month == 2 ) {
    return "季冬";
  }

}