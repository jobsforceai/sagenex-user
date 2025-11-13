// src/app/terms/page.tsx
import Navbar from "@/app/components/Navbar";
import Footer from "@/components/landing/footer";

const TermsPage = () => {
  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <main className="container mx-auto p-4 pt-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-emerald-400">Terms and Conditions</h1>
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">1. Introduction</h2>
              <p>Welcome to Sagenex. These Terms and Conditions govern your use of our website and the services we offer. By accessing our platform, you agree to be bound by these terms. Our services primarily consist of providing educational content and courses related to financial markets, trading, and investment strategies.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">2. Educational Services</h2>
              <p>Sagenex provides a range of educational materials, including but not limited to, online courses, articles, and tutorials. These materials are designed to teach you about financial markets and trading. Your purchase of a course grants you a license to access the educational content for your personal, non-commercial use.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">3. No Financial Advice</h2>
              <p>The content provided by Sagenex is for educational purposes only. We are not a financial advisory service and do not provide personalized financial advice. The information in our courses should not be construed as a recommendation to buy, sell, or hold any particular investment or security. Trading and investing involve substantial risk, and you are solely responsible for your own investment decisions.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">4. User Responsibility and Risk</h2>
              <p>You acknowledge that you are responsible for evaluating the risks associated with any investment you choose to make. After completing our courses, any investment or trading activity you undertake is at your own risk. Sagenex is not liable for any losses or damages that may result from your reliance on the information provided in our educational materials.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">5. Intellectual Property</h2>
              <p>All content on the Sagenex platform, including course materials, text, graphics, and logos, is the property of Sagenex and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works from our content without our express written permission.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">6. Limitation of Liability</h2>
              <p>Sagenex will not be liable for any direct, indirect, incidental, or consequential damages arising from your use of our website or educational services. Our liability is limited to the amount you have paid for the services.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-white">7. Changes to Terms</h2>
              <p>We reserve the right to modify these Terms and Conditions at any time. Any changes will be effective immediately upon posting to our website. Your continued use of our platform after such changes constitutes your acceptance of the new terms.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsPage;
