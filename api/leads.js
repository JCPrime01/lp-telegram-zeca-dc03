  import crypto from 'crypto';                                                                                                    

  export default async function handler(req, res) {                                                                                                                            
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');                                                                                                            
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');                                                                                                             
                                                                                                                                                                               
    if (req.method === 'OPTIONS') return res.status(200).end();                                                                                                                
    if (req.method !== 'POST') return res.status(405).json({ error: 'Apenas POST' });                                                                                          
                                                                                                                                                                               
    const { fbp, fbc, userAgent, em, ph, eventId } = req.body;                                                                                                                 
    const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
                                                                                                                                                                               
    const url = `https://graph.facebook.com/v21.0/${process.env.FB_PIXEL_ID}/events?access_token=${process.env.FB_ACCESS_TOKEN}`;                                              
                                          
    const hash = (val) => val ? crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex') : null;                                                             
                                                                                                                                                                               
    const payload = {
      data: [{                                                                                                                                                                 
        event_name: 'CompleteRegistration',
        event_time: Math.floor(Date.now() / 1000),                                                                                                                             
        event_id: eventId,                    
        action_source: 'website',         
        event_source_url: req.headers.referer || '',
        user_data: {                                                                                                                                                           
          client_ip_address: clientIp,
          client_user_agent: userAgent,                                                                                                                                        
          fbp: fbp,                       
          fbc: fbc,
          em: hash(em),                                                                                                                                                        
          ph: hash(ph)
        }                                                                                                                                                                      
      }]          
    };
                                              
    try {                                 
      const response = await fetch(url, {
        method: 'POST',                                                                                                                                                        
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),                                                                                                                                         
      });                                     
      const result = await response.json();
      console.log('FB CAPI response:', JSON.stringify(result));
                                                                                                                                                                               
      if (!response.ok) {
        console.error('FB CAPI error:', JSON.stringify(result));                                                                                                               
        return res.status(502).json({ error: 'Facebook rejeitou', detail: result });
      }                                   

      return res.status(200).json(result);                                                                                                                                     
    } catch (e) {
      console.error('Fetch error:', e.message);                                                                                                                                
      return res.status(500).json({ error: e.message });
    }                                     
  }
