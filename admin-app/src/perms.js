// უფლებები — სერვერის auth.PERMS-ის შესაბამისად
export const PERM_LABELS = {
  content: ["კონტენტი", "გვერდები, სერვისები, FAQ, გუნდი, მენიუ"],
  media: ["ფოტოები", "ბიბლიოთეკა: ატვირთვა და წაშლა"],
  settings: ["პარამეტრები", "კონტაქტები, SEO, დაჯავშნის განრიგი, ტექსტები"],
  inbox: ["განაცხადები", "ჯავშნები და შეტყობინებები (პერსონალური მონაცემები)"],
  backup: ["სარეზერვო ასლი", "ჩამოტვირთვა და აღდგენა"],
  users: ["ადმინისტრატორები", "მოწვევა, უფლებები, წაშლა"],
};
export const ROLES = [
  ["სრული ადმინისტრატორი", ["content", "media", "settings", "inbox", "backup", "users"]],
  ["რედაქტორი", ["content", "media"]],
  ["მენეჯერი (განაცხადები)", ["inbox"]],
];
export const roleName = (perms) => {
  const key = [...perms].sort().join();
  const r = ROLES.find(([, p]) => [...p].sort().join() === key);
  return r ? r[0] : "ინდივიდუალური";
};
