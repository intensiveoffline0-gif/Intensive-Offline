import handler from "./[studentId].js";

export default async function (req, res) {
  return handler(req, res);
}
