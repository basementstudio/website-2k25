export const generateEmailTemplate = (formData: {
  name: string
  company: string
  email: string
  budget?: string
  message: string
}) => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Contact Form Submission</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #111111;
      background-image: linear-gradient(to bottom, #0a0a0a, #111111);
    "
  >
    <div
      style="
        font-family: &quot;Geist&quot;, &quot;Arial&quot;, sans-serif;
        max-width: 580px;
        margin: 40px auto;
        background-color: #000000;
        color: #e6e6e6;
        padding: 40px 30px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
      "
    >
      <div style="margin-bottom: 36px; display: flex; align-items: center">
        <h1
          style="
            font-size: 24px;
            font-weight: 600;
            letter-spacing: -0.03em;
            color: #ff4d00;
            margin: 0;
            text-shadow: 0 2px 4px rgba(255, 77, 0, 0.2);
          "
        >
          basement.studio
        </h1>
      </div>

      <div style="margin-bottom: 32px">
        <h2
          style="
            font-size: 18px;
            font-weight: 600;
            letter-spacing: -0.02em;
            color: #e6e6e6;
            margin: 0 0 24px 0;
            padding-bottom: 12px;
            border-bottom: 1px solid #2e2e2e;
          "
        >
          New Contact Form Submission
        </h2>

        <div style="font-size: 14px; line-height: 1.5">
          <div
            style="
              display: grid;
              grid-template-columns: 100px 1fr;
              gap: 12px;
              margin-bottom: 16px;
              padding: 8px 0;
            "
          >
            <div style="color: #666666">Name</div>
            <div style="color: #e6e6e6">${formData.name}</div>
          </div>

          <div
            style="
              display: grid;
              grid-template-columns: 100px 1fr;
              gap: 12px;
              margin-bottom: 16px;
              padding: 8px 0;
            "
          >
            <div style="color: #666666">Company</div>
            <div style="color: #e6e6e6">${formData.company}</div>
          </div>

          <div
            style="
              display: grid;
              grid-template-columns: 100px 1fr;
              gap: 12px;
              margin-bottom: 16px;
              padding: 8px 0;
            "
          >
            <div style="color: #666666">Email</div>
            <div style="color: #e6e6e6">${formData.email}</div>
          </div>

          <div
            style="
              display: grid;
              grid-template-columns: 100px 1fr;
              gap: 12px;
              margin-bottom: 24px;
              padding: 8px 0;
            "
          >
            <div style="color: #666666">Budget</div>
            <div style="color: #e6e6e6">${formData.budget || "N/A"}</div>
          </div>

          <div
            style="
              margin-top: 24px;
              padding-top: 24px;
              border-top: 1px solid #2e2e2e;
            "
          >
            <div style="color: #666666; margin-bottom: 12px">Message</div>
            <div
              style="
                color: #c4c4c4;
                line-height: 1.6;
                background-color: #0a0a0a;
                padding: 20px;

                border-left: 3px solid #ff4d00;
              "
            >
              ${formData.message}
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top: 32px; display: flex">
        <a
          href="mailto:${formData.email}"
          style="
            display: inline-block;
            background: linear-gradient(135deg, #ff4d00, #ff6a00);
            color: #000000;
            text-decoration: none;
            padding: 12px 24px;
            font-weight: 600;
            letter-spacing: -0.02em;
            border: none;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(255, 77, 0, 0.3);
          "
          >Reply to ${formData.name} (${formData.email})</a
        >
      </div>
    </div>
  </body>
</html>`
