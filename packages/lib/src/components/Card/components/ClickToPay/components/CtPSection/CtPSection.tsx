import { h } from 'preact';
import useCoreContext from '../../../../../../core/Context/useCoreContext';
import getImage from '../../../../../../utils/get-image';
import Img from '../../../../../internal/Img';
import CtPLogoutLink from './CtPLogoutLink';
import classnames from 'classnames';
import './CtPSection.scss';

// TODO: filter available brands
const brands = ['mc', 'visa'];

interface CtPSectionProps {
    children?: any;
}

const CtPSection = ({ children }: CtPSectionProps): h.JSX.Element => {
    const { loadingContext } = useCoreContext();

    const url = getImage({ loadingContext })('ctp');
    const pipe = getImage({ loadingContext, imageFolder: 'components/' })('pipe');
    return (
        <div className="adyen-checkout-ctp__section">
            <div className="adyen-checkout-ctp__section-header">
                <Img className="adyen-checkout-ctp__section-header-logo" src={url} alt={url} />

                <Img className="adyen-checkout-ctp__section-header-pipe" src={pipe} alt={pipe} />

                {brands.map(brand => (
                    <Img
                        key={brand}
                        className={classnames('adyen-checkout-ctp__section-header-scheme', `adyen-checkout-ctp__section-header-scheme-${brand}`)}
                        src={getImage({ loadingContext })(brand)}
                        alt={brand}
                    />
                ))}
                <CtPLogoutLink />
            </div>
            {children}
        </div>
    );
};

export default CtPSection;
