import { useState, useEffect } from "react";
import { Send, Globe, Loader2 } from "lucide-react";

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

function App() {
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

 
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          setUrl(tabs[0].url);
        }
      });
    }
  }, []);

  const handleSend = async () => {
    if (!url) return;
    
    setLoading(true);
    setResponse(null);

    try {   
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      
      if (!tab.id) {
        throw new Error("No active tab found");
      }

      function pageContextFetch(targetUrl: string, method: string, body: string) {
        const options: RequestInit = {
          method,
          credentials: 'include',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        };

        if (method !== 'GET' && method !== 'HEAD' && body) {
          try {
            JSON.parse(body);
            options.body = body;
          } catch (e) {
            return JSON.stringify({ error: "Invalid JSON in request body" });
          }
        }

        return fetch(targetUrl, options)
          .then(async (res) => {
            const text = await res.text();
            try {
              const json = JSON.parse(text);
              return JSON.stringify({
                status: res.status,
                statusText: res.statusText,
                data: json
              }, null, 2);
            } catch {
              return `Status: ${res.status} ${res.statusText}\n\n${text}`;
            }
          })
          .catch(err => JSON.stringify({ error: err.message }));
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: pageContextFetch,
        args: [url, method, body]
      });

      setResponse(results[0].result as string);

    } catch (err: any) {
      setResponse(`Error: ${err.message || "Failed to send request"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 w-full border-l border-gray-200 flex flex-col">
      <h1 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
        <Globe size={20} className="text-blue-600"/> 
        BrowserFox
      </h1>

      <div className="flex gap-2 mb-4 h-10">
        <div className="relative h-full">
          <select 
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            className="h-full appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:border-blue-500 font-medium cursor-pointer font-mono text-sm"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
          
        <input 
          className="flex-1 border border-gray-300 rounded px-4 py-2 text-gray-700 focus:outline-none focus:border-blue-500 font-mono text-xs"
          type="text" 
          placeholder="https://api.example.com" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
      </div>

      {method !== 'GET' && method !== 'DELETE' && (
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
            JSON Body
          </label>
          <textarea 
            className="w-full h-32 p-2 border border-gray-300 rounded-lg font-mono text-xs focus:outline-none focus:border-blue-500 resize-none bg-white" 
            value={body} 
            onChange={(e) => setBody(e.target.value)}
            placeholder='{"key": "value"}'
          ></textarea>        
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
      >
        {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
        {loading ? 'Sending...' : 'Send Request'}
      </button>

      <div className="mt-6 border-t border-gray-200 pt-4 flex-1 flex flex-col">
        <h2 className="text-sm font-bold text-gray-500 mb-2">Response</h2>
        <div className="bg-gray-900 rounded-md p-4 flex-1 min-h-[200px] text-green-400 font-mono text-xs overflow-x-auto shadow-inner relative group">
           {response && (
             <button 
               onClick={() => navigator.clipboard.writeText(response)}
               className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-gray-700 text-white text-[10px] px-2 py-1 rounded hover:bg-gray-600 transition"
             >
               Copy
             </button>
           )}
          <pre className="whitespace-pre-wrap break-all">
            {response || "// Response will appear here..."}
          </pre>       
        </div>
      </div>
    </div>
  )
}

export default App;
