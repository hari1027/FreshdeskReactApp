
import React, { useEffect, useState } from 'react'
import './App.css'
import { Card, Tooltip } from '@mui/material';

export default function App() {

  const [appInitialised, setAppInitialized] = useState(false);
  const [contactText, setContactText] = useState("");
  const [number, setNumber] = useState('');
  const [notvalid, setNotValid] = useState(false);
  const [specificTickets, setSpecificTickets] = useState(null);
  const [client, setClient] = useState(null)

  const numberAfterRefresh = localStorage.getItem('number')
  const numberAfterTicketBack = sessionStorage.getItem('number')

  useEffect(() => {
    fdApp.init()
  }, [])

  var fdApp = {
    client: null,
    data: {},

    interface: {
      trigger: async (action, value) => {
        await client.interface.trigger(action, value);
      },
      notify: async (type, title, message) => {
        await fdApp.interface.trigger("showNotify", { type: type, title: title, message: message });
      },
      open: async (element, data) => {
        await fdApp.interface.trigger("click", { id: element, value: data || "" });
      }
    },

    init: async () => {
      try {
        fdApp.client = await app.initialized().then((_client) => {
          setClient(_client)
          return _client
        }, (error) => {
          console.error("freshdesk init error: ", error);
          fdApp.interface.notify("danger", "freshdesk init error:", error);
          return null;
        });
        if (fdApp.client !== null) {
          fdApp.interface.notify("success", "App", "Initialization Success");
          fdApp.client.events.on("app.activated", setAppInitialized(true));
          if (numberAfterRefresh !== null && numberAfterRefresh !== '') {
            onClickSaveButton(numberAfterRefresh)
          }
          if (numberAfterTicketBack !== null && numberAfterTicketBack !== '') {
            onClickSaveButton(numberAfterTicketBack)
          }
        } else {
          fdApp.interface.notify("danger", "App", "Initialization failed");
        }
      }
      catch (error) {
        console.log(error)
      }
    },

    invoke: async (name, data) => {
      if (client !== null) {
        return await client.request.invokeTemplate(name, (data || {})).then((data) => {
          return JSON.parse(data.response);
        }, (error) => {
          console.error("freshdesk request error: ", name, JSON.stringify(data || {}), JSON.stringify(error));
          return null;
        });
      }
      else {
        return await fdApp.client.request.invokeTemplate(name, (data || {})).then((data) => {
          return JSON.parse(data.response);
        }, (error) => {
          console.error("freshdesk request error: ", name, JSON.stringify(data || {}), JSON.stringify(error));
          return null;
        });
      }
    },

    contact: {
      search: async (contactNumber) => {
        let query = ("\\\"" + ("phone:'" + encodeURIComponent(contactNumber) +  "'") + "\\\"");

        let contacts = await fdApp.invoke("searchContact", { context: { query: query } });
        if (contacts.total < 1) {
          setContactText("Contact does not exist's")
          setSpecificTickets(null)
        }
        else {
          setContactText("")
          let requester_id = contacts.results[0].id;
          const ticketdetails = await fdApp.invoke("getTicket", { context: { requester_id: requester_id } });
          const specificTicket = []
          ticketdetails.map((data) => {
            if (data.requester_id === requester_id) {
              specificTicket.push(data)
            }
          })
          setSpecificTickets(specificTicket)
          if (specificTicket.length < 1) {
            setContactText("No Ticket available with this Contact")
          }
        }
      }
    }
  }

  window.onbeforeunload = function () {
    localStorage.setItem('number', number)
  }

  function onClickSaveButton(num) {
    setNumber(num)
    if (num !== '' && num !== null) {
      setNotValid(false);
      fdApp.contact.search(num)
    }
    else {
      setNotValid(true)
    }
    localStorage.removeItem('number')
    sessionStorage.removeItem('number')
  };

  async function onClickCard(ticketId) {
    try {
      fdApp.interface.open("ticket", ticketId);
      sessionStorage.setItem('number', number);
    } catch (error) {
      console.error(error);
      fdApp.interface.notify("danger", "ticket:", error);
    }
  }

  function information(createdAt, frDueBy, dueBy) {
    let timeAfterticketCreation = "-"
    if (new Date().toISOString > createdAt) {
      timeAfterticketCreation = new Date() - new Date(createdAt)
      timeAfterticketCreation = toDisplayTimeContent(timeAfterticketCreation)
    }

    let timeafterOverDue = "-"
    let timebeforefeDue = "-"
     if (dueBy > new Date().toISOString) {
      timeafterOverDue = new Date() - new Date(dueBy) 
      timeafterOverDue = toDisplayTimeContent(timeafterOverDue)
    }
    else if (frDueBy < new Date().toISOString) {
      timebeforefeDue = new Date(frDueBy) - new Date() 
      if(timebeforefeDue < 0){
        timebeforefeDue = '-'
        timeafterOverDue = new Date() - new Date(frDueBy) 
        timeafterOverDue = toDisplayTimeContent(timeafterOverDue)
      }
      if(timebeforefeDue > 0){
      timebeforefeDue = toDisplayTimeContent(timebeforefeDue)
      }
    }

    if (timebeforefeDue !== "-") {
      return `Created:${timeAfterticketCreation} ago . First response due in:  ${timebeforefeDue} .`
    }
    else {
      return `Created:${timeAfterticketCreation} ago . OverDueBy: ${timeafterOverDue} .`
    }
  }

  function toDisplayTimeContent(timeDifference) {
    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

    if (days > 0) {
      timeDifference = `${days} days`
    }
    else if (hours > 0) {
      timeDifference = `${hours} hours`
    }
    else if (minutes > 0) {
      timeDifference = `${minutes} minutes`
    }
    else {
      timeDifference = `${seconds} seconds`
    }
    return timeDifference;
  }

  const one_day = 24 * 60 * 60 * 1000

  return (
    (appInitialised) ?
      <div className='main'>
        <label className="PhoneNumberText">Enter a PhoneNumber to Search Tickets</label>
        <input className="phoneNumberField" type="text" value={number ? number : (numberAfterRefresh ? numberAfterRefresh : (numberAfterTicketBack ? numberAfterTicketBack : ''))} onChange={(e) => { setNumber(e.target.value) }}></input>
        {notvalid && <label className="validationText">PhoneNumber cannot be Empty</label>}
        <label className="noContactOrTicketText">{contactText}</label>
        <button className="button" onClick={() => { onClickSaveButton(number) }}>Search</button>

        {(specificTickets !== null) ?
          specificTickets.map((ticket) => {
            return (
              <Card className='card' onClick={() => { onClickCard(ticket.id) }}>
                <div className='grid1'>
                  <p className={((Math.abs(new Date() - new Date(ticket.fr_due_by)) < one_day) || (ticket.due_by > new Date().toISOString)) ? "overDue" : "new"}>
                    {(ticket.due_by > new Date().toISOString) ? "OverDue" : (Math.abs(new Date() - new Date(ticket.fr_due_by)) < one_day) ? "First Response Due" : "New"}
                  </p>
                  <p className="subject">
                    {ticket.subject + " " + `#${ticket.id}`}
                  </p>
                  <p className='information'>
                    {information(ticket.created_at, ticket.fr_due_by, ticket.due_by)}
                  </p>
                </div>
                <div className='grid2'>
                  <Tooltip title="Priority">
                    <label className={(ticket.priority === 1) ? "low grid2FontWeights" : ((ticket.priority === 2) ? "medium grid2FontWeights" : ((ticket.priority === 3) ? "high grid2FontWeights" : ((ticket.priority === 4) ? "urgent grid2FontWeights" : null)))}>
                      {(ticket.priority === 1) ? "Low" : ((ticket.priority === 2) ? "Medium" : ((ticket.priority === 3) ? "High" : ((ticket.priority === 4) ? "Urgent" : null)))}
                    </label>
                  </Tooltip>
                  <Tooltip title="Agent">
                    <p className='grid2FontWeights'>
                      Ozonetel Integration
                    </p>
                  </Tooltip>
                  <Tooltip title="Status">
                    <p className={(ticket.status === 2) ? "high grid2FontWeights" : ((ticket.priority === 3) ? "urgent grid2FontWeights" : ((ticket.priority === 4) ? "medium grid2FontWeights" : ((ticket.priority === 5) ? "open grid2FontWeights" : null)))}>
                      {(ticket.status === 2) ? "Open" : ((ticket.priority === 3) ? "Pending" : ((ticket.priority === 4) ? "Resolved" : ((ticket.priority === 5) ? "Closed" : null)))}
                    </p>
                  </Tooltip>
                </div>
              </Card>
            )
          })
          : <div></div>
        }

      </div>
      :
      <div></div>
  )
}
