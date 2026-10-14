export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const payload = req.body;

  // Log it so you can see Shopflo's real field names in Vercel's dashboard
  console.log("Shopflo payload:", JSON.stringify(payload));

  // --- Adjust these three lines once you see the real payload shape ---
  const name = payload.customer?.name || payload.customer?.first_name || "there";
  const amount = payload.total || payload.order_total || "";
  const checkoutUrl = payload.checkout_url || payload.url || "";
  const token = checkoutUrl.split("tokenId=")[1] || "";
  const rawPhone = payload.customer?.phone || payload.phone || "";
  const phone = rawPhone.replace(/\D/g, ""); // digits only
  // ----------------------------------------------------------------

  try {
    const response = await fetch("https://backend.aisensy.com/campaign/t1/api/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: process.env.AISENSY_API_KEY,
        campaignName: "Abandoned Checkout – Shopflo v3",
        destination: phone,
        userName: name,
        templateParams: [name, amount, token],
      }),
    });

    const result = await response.json();
    return res.status(200).json({ ok: true, aisensy: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
