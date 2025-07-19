import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  nome: string;
  telefone: string;
  email: string;
  assunto: string;
  mensagem: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nome, telefone, email, assunto, mensagem }: ContactEmailRequest = await req.json();

    console.log("Sending contact email for:", nome, email);

    // Save contact message to database
    const { error: dbError } = await supabase
      .from('contact_messages')
      .insert({
        nome,
        telefone,
        email,
        assunto,
        mensagem,
        status: 'pending'
      });

    if (dbError) {
      console.error("Error saving to database:", dbError);
      // Continue with email sending even if database save fails
    }

    // Send email to the business
    const emailResponse = await resend.emails.send({
      from: "Pelúcia Pet <onboarding@resend.dev>",
      to: ["contato@peluciapet.com"], // Change this to your business email
      subject: `Nova mensagem de contato: ${assunto}`,
      html: `
        <h1>Nova mensagem de contato</h1>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Telefone:</strong> ${telefone}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Assunto:</strong> ${assunto}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${mensagem.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>Mensagem enviada através do formulário de contato do site.</em></p>
      `,
    });

    // Send confirmation email to the customer
    await resend.emails.send({
      from: "Pelúcia Pet <onboarding@resend.dev>",
      to: [email],
      subject: "Recebemos sua mensagem - Pelúcia Pet",
      html: `
        <h1>Obrigado pelo contato, ${nome}!</h1>
        <p>Recebemos sua mensagem e entraremos em contato em breve.</p>
        <p><strong>Seu assunto:</strong> ${assunto}</p>
        <p><strong>Sua mensagem:</strong></p>
        <p>${mensagem.replace(/\n/g, '<br>')}</p>
        <hr>
        <p>Atenciosamente,<br>Equipe Pelúcia Pet</p>
      `,
    });

    console.log("Contact email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);