              disabled={loading}
            >
              {loading ? 'Sending Instructions...' : 'Reset Password'}
            </Button>
            <Grid container>
              <Grid item xs>
                <Link 
                  component={RouterLink} 
                  to="/auth/login" 
                  variant="body2"
                >
                  Back to Login
                </Link>
              </Grid>
              <Grid item>
                <Link 
                  component={RouterLink} 
                  to="/auth/register" 
                  variant="body2"
                >
                  Create new account
                </Link>
              </Grid>
            </Grid>
          </form>
        );
      
      case 'instructions':
        return (
          <div className={classes.form}>
            <Typography 
              variant="h6" 
              color="primary" 
              className={classes.info}
            >
              Password Reset Instructions Sent
            </Typography>
            <Typography 
              variant="body1" 
              paragraph
              className={classes.info}
            >
              We've sent password reset instructions to {email}. 
              Please check your email inbox (and spam folder) 
              for further steps to reset your password.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
              onClick={() => setResetStep('request')}
            >
              Resend Instructions
            </Button>
            <Grid container justifyContent="center" style={{ marginTop: 16 }}>
              <Grid item>
                <Link 
                  component={RouterLink} 
                  to="/auth/login" 
                  variant="body2"
                >
                  Return to Login
                </Link>
              </Grid>
            </Grid>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="xs" className={classes.root}>
      <Paper elevation={6} className={classes.paper}>
        <Typography component="h1" variant="h5">
          Reset Password
        </Typography>
        {renderResetContent()}
      </Paper>
    </Container>
  );
};

export default ResetPassword;
