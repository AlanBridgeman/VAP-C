import { Popover, OverlayTrigger, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import style from '../../styles/fontawesome.module.css';

interface props {
    text: string
}

export default function FormInfo(props: props) {
    const infoClick = (e) => {
        let buttonState = e.currentTarget.getAttribute('aria-pressed') === 'true';
        e.currentTarget.setAttribute('aria-pressed', buttonState ? 'false' : 'true');
    };

    const popover = (
        <Popover id="popover-basic">
            { /*<Popover.Header as="h3">Popover right</Popover.Header>*/ }
            <Popover.Body style={{backgroundColor: "#444444", borderColor: "#444444", color: "#FFFFFF"}}>
                {props.text}
            </Popover.Body>
        </Popover>
    );
    
    return (
        <>
            <OverlayTrigger trigger="click" placement="right" overlay={popover}>
                <Button variant="outline-secondary" value="info" className="btn-circle" aria-pressed="false" onClick={infoClick}>
                    <span className="sr-only">Info</span>
                    <FontAwesomeIcon className={style.g5so} icon={['fad', 'info-circle']} style={{width: "100%", height: "100%"}} />
                </Button>
            </OverlayTrigger>
        </>
    );
}