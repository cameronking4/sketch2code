'use client';

import Image from 'next/image';
import { useRef, useState, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import DropDown from '../components/DropDown';
import Footer from '../components/Footer';
import Sandbox from '../components/Sandpack';
import Header from '../components/Header';
import { useChat } from 'ai/react';
import Webcam from "react-webcam";
import axios from "axios";

const OAI_APIKEY = process.env.OPENAI_API_KEY;

const dependencies = {
  "react": "latest",
  "react-dom": "latest",
  "axios": "latest", // For making HTTP requests
  "react-router-dom": "latest", // For routing
  "redux": "latest", // For state management
  "react-redux": "latest", // React bindings for Redux
  "redux-thunk": "latest", // Middleware for Redux asynchronous actions
  "styled-components": "latest", // For CSS in JS
  "react-icons": "latest", // A set of free MIT-licensed high-quality SVG icons
};

export const upload = async (persona, base64_img) => {
  console.log("base64", base64_img);
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert react developer. Create a full fledged protoype using react for the sketch provided. It is your job to generate an app.js page and use inline tailwind styling to replicate the exact image as fully functional as possible (useState / useEffect) for a web application. You may leverage the imports: ${Object.keys(dependencies).join(", ")}. But remember to add them as imports in the App.js file. Be helpful by going beyond UI and layout and implement all inferrable functions and use icons. Make multiple components within file and reference in App() if you have to.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: base64_img,
              },
            },
          ],
        },
        {
          role: "user",
          content: `Please return only the code for App.js! If you have anything outside of code to say, place as a comment at the beginning using //. Your response will be used directly in code for an App.js file.`,
        },
      
      ],
      max_tokens: 3000,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OAI_APIKEY}`,
      },
    }
  );
  let msg = res.data.choices[0].message.content;
  console.log(res.data);
  return msg;
};


export const reDo = async (textEdits, base64_img) => {
  console.log("base64", base64_img);
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert react developer. Create a full fledged protoype using react for the sketch provided. It is your job to generate an app.js page and use inline tailwind styling to replicate the exact image as fully functional as possible (useState / useEffect) for a web application. Go beyond UI by implementing inferrable functions or icons, helping the user take this several steps forward.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: base64_img,
              },
            },
          ],
        },
        {
          role: "user",
          content: `Edit the following App.js. I want to: ${textEdits}. Your response will be used directly in code for this App.js file.`,
        },
      
      ],
      max_tokens: 2500,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OAI_APIKEY}`,
      },
    }
  );
  let msg = res.data.choices[0].message.content;
  console.log(res.data);
  return msg;
};

export default function Page() {
    const [img, setImg] = useState(null);
    const webcamRef = useRef();
    const [vibe, setVibe] = useState('React');
    const [generating, isGenerating] = useState(false);
    const [regenerating, isRegenerating] = useState(false);
    const [response, setResponse] = useState(null);
    const [responseText, setResponseText] = useState('');

    const capture = useCallback(async () => {
      const imageSrc = webcamRef?.current.getScreenshot();
      if (imageSrc) {
        setImg(imageSrc);
      } else {
        // Handle the case where the screenshot couldn't be captured
        console.error("Failed to capture screenshot from webcam");
      }
  }, [webcamRef]);

    const sendUpload = async () => {
        isGenerating(true);
        const response = await upload(vibe, img);
        toast.success("Success!")
        setResponse(response);
    }

    const regenerate = async (textEdits) => {
        isRegenerating(true);
        if(textEdits.length > 10) {
          const response = await reDo(textEdits, img);
          setResponse(response);
        } else {
          const response = await upload(vibe, img);
          setResponse(response);
        }
        toast.success("Regenerated");
        isRegenerating(false);
    }

    const regenerateContent = async () => {
        await regenerate(responseText);
    };

    return (
      <div className="flex max-w-5xl mx-auto flex-col items-center justify-center py-2 min-h-screen">
          <div>
              <Toaster
                  position="top-center"
                  reverseOrder={true}
                  toastOptions={{ duration: 10000 }}
              />
          </div>
          <Header />
          <main className="flex flex-1 w-full flex-col items-center justify-center text-center px-4 mt-6 sm:mt-12">
              <h2 className="sm:text-6xl text-4xl max-w-[708px] font-bold text-slate-900">
                  {response ? `Voila! Try your ${vibe} code` : 'Generate code from a hand-drawn sketch'}
              </h2>
              {response ? (
                  <div className='w-full'>
                      <br />
                      <Sandbox Appjs={response} />
                      <br />
                      <div className="container mx-auto my-8 p-5 border-2 border-gray-200 rounded-lg shadow-md">
                          <h3>Regenerate App</h3>
                          <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 md:space-x-4">
                              <div className="w-full">
                                  <label htmlFor="responseTextArea" className="block text-sm font-medium text-gray-700">
                                      (Optional) Add an additional prompt here to edit app: 
                                  </label>
                                  <div className='flex auto'>
                                      <textarea
                                          id="responseTextArea"
                                          rows="1"
                                          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                          value={responseText}
                                          onChange={(e) => setResponseText(e.target.value)}
                                      />
                                  </div>
                                  {regenerating ?
                                      <button
                                          className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-2 mt-2 hover:bg-black/80 w-full"
                                          disabled
                                      >
                                          <span className="loading">
                                              <span style={{ backgroundColor: 'white' }} />
                                              <span style={{ backgroundColor: 'white' }} />
                                              <span style={{ backgroundColor: 'white' }} />
                                          </span>
                                      </button>
                                      :
                                      <button
                                          onClick={regenerateContent}
                                          className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full"
                                      >
                                        {responseText.length > 10 ? "Regenerate with text edits" : "Try again using sketch"};
                                      </button>
                                  }
                              </div>
                          </div>
                      </div>
                  </div>
              ) : (
                  <>
                      <div className="max-w-xl w-full">
                          <div className="flex mt-10 items-center space-x-3">
                              <Image
                                  src="/1-black.png"
                                  width={30}
                                  height={30}
                                  alt="1 icon"
                                  className="mb-5 sm:mb-0"
                              />
                              <p className="text-left font-medium">
                                  Submit your sketch.{' '}
                                  <span className="text-slate-500">
                                      (doesn't need to be perfect)
                                  </span>
                              </p>
                          </div>
                          {img === null ? (
                              <>
                                  <div className='mt-2' />
                                  <Webcam
                                      ref={webcamRef}
                                      screenshotFormat="image/jpeg"
                                      minScreenshotWidth={800}
                                      minScreenshotHeight={600}
                                  />
                              </>
                          ) : (
                              <>
                                  <img className='mt-2' width="100%" height="100%" src={img} alt="screenshot" />
                                  <div className="flex mt-5 mb-5 items-center space-x-3">
                                      <Image src="/2-black.png" width={30} height={30} alt="1 icon" />
                                      <p className="text-left font-medium">What kind of project?</p>
                                  </div>
                                  <div className="block">
                                      <DropDown vibe={vibe} setVibe={(newVibe) => setVibe(newVibe)} />
                                  </div>
                              </>
                          )}
                          {!generating ? (
                              <>
                                  {img === null ? (
                                      <button
                                          className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-4 mt-4 hover:bg-black/80 w-full"
                                          onClick={() => capture()}
                                      >
                                          Capture sketch &rarr;
                                      </button>
                                  ) : (
                                      <button
                                          className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-4 mt-4 hover:bg-black/80 w-full"
                                          onClick={() => sendUpload()}
                                      >
                                          Generate code sandbox &rarr;
                                      </button>
                                  )}
                              </>
                          ) : (
                              <button
                                  className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-4 mt-4 hover:bg-black/80 w-full"
                                  disabled
                              >
                                  <span className="loading">
                                      <span style={{ backgroundColor: 'white' }} />
                                      <span style={{ backgroundColor: 'white' }} />
                                      <span style={{ backgroundColor: 'white' }} />
                                  </span>
                              </button>
                          )}
                      </div>
                  </>
              )}
          </main>
          <br />
          <Footer />
      </div>
    );
}
