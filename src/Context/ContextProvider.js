import { createContext, useState } from "react";
import run from "../Config/Gemini";

export const Context = createContext();

const ContextProvider = (props) => {
  const [input, setInput] = useState('');
  const [recentPrompt, setRecentPrompt] = useState('');
  const [previousPrompt, setPreviousPrompt] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState('');
  const [responses, setResponses] = useState([]);
  const [dataSent, setDataSent] = useState(false);

  const resetChat = () => {
    setResponses([]);
    setDataSent(false);
  };

  const formatResponse = (response) => {
    if (!response) return '';

    if (response.startsWith("## ")) {
      response = response.substring(3);
    }

    const responseArray = response.split("**");
    let formattedResponse = "";
    for (let i = 0; i < responseArray.length; i++) {
      formattedResponse += i % 2 === 0 ? responseArray[i] : "<b>" + responseArray[i] + "</b>";
    }
    return formattedResponse.split("*").join("<br/>");
  };

  const onSent = async () => {
    if (!input.trim()) return;
    
    const history = responses.flatMap(item => {
        const historyArray = [];
        historyArray.push({
             role: "user",
             content: item.prompt
        });
        if (item.response) {
              historyArray.push({
                role: "assistant",
                content: item.response
              });
        }
        return historyArray;
    });
    const updatedHistory = [...history, { role: "user", content: input }];
    setLoading(true);
    setShowResult(true);
    setRecentPrompt(input);
    setPreviousPrompt((prevPrompts) => [...prevPrompts, input]);

    try {
      const response = await run(input, updatedHistory);
      const formattedResponse = response ? formatResponse(response) : "No response received.";
      const newResponse = { prompt: input, response: formattedResponse };
      setResponses((prevResponses) => [...prevResponses, newResponse]);
      setResultData(formattedResponse);
    } catch (error) {
      const errorMessage = "Error: " + error.message;
      const newResponse = { prompt: input, response: errorMessage };
      setResponses((prevResponses) => [...prevResponses, newResponse]);
      setResultData(errorMessage);
    }

    setLoading(false);
    setInput("");
  };

  const contextValue = {
    previousPrompt,
    setPreviousPrompt,
    onSent,
    setRecentPrompt,
    recentPrompt,
    showResult,
    loading,
    resultData,
    responses,
    setResponses,
    setLoading,
    input,
    setInput,
    resetChat,
    dataSent,
    setDataSent,
  };

  return (
    <Context.Provider value={contextValue}>{props.children}</Context.Provider>
  );
};

export default ContextProvider;
