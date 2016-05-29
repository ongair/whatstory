$(function() {
  console.log('Ready...');

  window.Router = ReactRouter.Router;
  window.Route = ReactRouter.Route;
  window.IndexRoute = ReactRouter.IndexRoute;
  window.hashHistory = ReactRouter.hashHistory;
  window.browserHistory = ReactRouter.browserHistory;
  window.Link = ReactRouter.Link;
  window.IndexLink = ReactRouter.IndexLink;

  var Hero = React.createClass({
    render: function() {
      return (
        <div className="section no-pad-bot hero" id="index-banner">
          <div className="container">
            <br/>
            <br/>
            <i className="material-icons message large">message</i>
            <h1 className="header center orange-text">Working Title</h1>
            <div className="row center">
              <h5 className="header col s12 light">Storify your WhatsApp conversations</h5>
            </div>
            <div className="row center">
              <Link to="stories/new" className="btn-large waves-effect waves-light orange">Storify</Link>            
            </div>
            <br/>
            <br/>
          </div>
        </div>
      )
    }
  });

  var App = React.createClass({
    render: function() {
      return (
        <div>
          <NavBar />
          {this.props.children || <Hero />}
        </div>
      )
    }
  });

  var NavBar = React.createClass({
    render: function() {
      return (
        <nav className="light-blue lighten-1" role="navigation">
          <div className="nav-wrapper container">
            <IndexLink  to="/" className="brand-logo">Working Title</IndexLink>
            <ul className="right hide-on-med-and-down">
              <NavLink to="stories/new">New</NavLink>
              <li><a href="#">Stories</a></li>
              <NavLink to="about">About</NavLink>
              <li><a href="#">Terms</a></li>

            </ul>
          </div>
        </nav>  
      );
    }
  });

  var Stories = React.createClass({
    render: function() {
      return (
        <div className="container">
        </div>
      );
    }
  });

  var Story = React.createClass({
    getInitialState: function() {
      return {
        status: 'new'
      };
    },
    componentDidMount: function() {
      // debugger;
      var id = this.props.params.id;      
      var self = this;

      $.getJSON("/stories/" + id, function(data) {
        console.log("Story ", data);
        self.setState({ status: data.status, messages: data.messages });
      });
    },
    render: function() {
      console.log('About to render the story');
      return (
        <div className="container">
          <div className="row heading">
            
          </div>
        </div>
      );
    }
  });

  var NewStory = React.createClass({
    contextTypes: {
      router: React.PropTypes.object
    },
    uploadStory: function(evt) {
      console.log('Ready to upload');
      evt.preventDefault();

      var form = $(this)[0];
      var data = new FormData();
      data.append('email', $('#email').val())
      data.append('file', $('#file')[0].files[0]);

      $('#upload-btn').addClass('disabled');
      var router = this.context.router;

      $.ajax({
        url: '/stories',
        data: data,
        type: 'POST',
        cache: false,
        contentType: false,
        processData: false,
        success: function(data, status, xhr) {
          var path = "/stories/" + data.key + "/";

          console.log("Redirect to ", path);
          router.push(path);
        },
        error: function(xhr, status, error) {
          console.log("Error : ", error);
        }
      });
    },
    render: function() {
      return (
        <div className="container">
          <div className="row heading">
            <div className="col s6 offset-s3">
              <h4 className="header blue-text">Create your Story</h4>
              <p className="flow-text">Share with the world that WhatsApp conversation on your phone</p>
            </div>          
          </div>
          <div className="row">
            <form id="upload-form" onSubmit={ this.uploadStory } method="POST" action="/stories" className="col s6 offset-s3">
              <div className="row">
                <div className="input-field col s12">
                  <input id="email" type="email" className="validate" placeholder="We require your email address before publishing" />
                  <label className="active" for="email">Email</label>
                </div>
              </div>
              <div className="row">
                <div className="file-field input-field col s12">
                  <div className="btn">
                    <span>File</span>
                    <input id="file" type="file" className="validate" accept=".zip" />
                  </div>
                  <div className="file-path validate">
                    <input className="file-path validate" type="text" placeholder="Upload the zip file with your exported conversation" />
                  </div>                  
                </div>
              </div>
              <div className="row">
                <div className="input-field col s12">
                  <div className="preloader-wrapper medium">
                    <div className="spinner-layer spinner-blue-only">
                      <div className="circle-clipper left">
                        <div className="circle"></div>
                      </div>
                      <div className="gap-patch">
                        <div className="circle"></div>
                      </div>
                      <div className="circle-clipper right">
                        <div className="circle"></div>
                      </div>
                    </div>
                  </div>
                  
                  <button id='#upload-btn' className="btn-large btn-float-right waves-effect waves-light red">Upload</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      );
    }
  });

  var About = React.createClass({
    render: function() {
      return (
        <div className="container">
          <div className="row">
            <div className="col s12">
              <h2 className="header">About What Story</h2>
              <p className="">My money's in that office, right? If she start giving me some bullshit about it ain't there, and we got to go someplace else and get it, I'm gonna shoot you in the head then and there. 
              Then I'm gonna shoot that bitch in the kneecaps, find out where my goddamn money is. She gonna tell me too. Hey, look at me when I'm talking to you, motherfucker. You listen: we go in there, and that 
              nigga Winston or anybody else is in there, you the first motherfucker to get shot. You understand?</p>
            </div>
          </div>
        </div>
      );
    }
  });


  var NavLink = React.createClass({
    render() {
      return (<li activeClassName="active"><Link {...this.props} /></li>)
    }
  });
  
  ReactDOM.render(
    (
      <Router history={hashHistory}>
        <Route path="/" component={App}>
          <IndexRoute component={Hero}/>

          <Route path="stories" component={ Stories } >            
          </Route>

          <Route path="stories/new" component={ NewStory } router={this} />
          <Route path="stories/:id/" component= { Story } router={this} />

          <Route path="about" component={ About } /> 
        </Route>
      </Router>
    )
    ,document.getElementById('main'));
});