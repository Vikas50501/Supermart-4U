export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const payload = req.body;

  console.log("Shopflo payload:", JSON.stringify(payload));

  // Only act on real abandoned checkouts, not Shopflo's test ping
  if (payload.eventName !== "checkout_abandoned") {
    return res.status(200).json({ ok: true, skipped: true });
  }

  const data = payload.eventPayload;

  const name = data.customer?.first_name || "there";
  const amount = `₹${data.checkout?.pricing?.total || ""}`;
  const token = data.tokenId || "";
  const rawPhone = data.customer?.phone || "";
  const phone = rawPhone.replace(/\D/g, ""); // strip the "+" and any spaces, digits only

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
    console.log("AiSensy response:", JSON.stringify(result));
    return res.status(200).json({ ok: true, aisensy: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
